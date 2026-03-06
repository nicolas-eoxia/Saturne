/* Copyright (C) 2026 EVARISK <technique@evarisk.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Library javascript to manage native HTML dialogs
 */

/**
 * \file    js/modules/ui-dialogs.js
 * \ingroup saturne
 * \brief   JavaScript file ui-dialogs for module Saturne.
 *
 * This file registers all native HTML (<dialog>) dialogs for the Saturne module
 * via the Dolibarr uiDialog system, using a hybrid approach:
 *
 *   - window.saturne.uiDialogs.register() — generic initializer driven by data-*
 *     attributes on the trigger button. No JS needed for simple dialogs (read-only
 *     content, no form, standard close footer). Covers ~80% of use cases.
 *
 *   - window.saturne.uiDialogs.registerXxx() — dedicated method for complex dialogs
 *     requiring AJAX form submission, onSuccess callbacks, or a fully custom footer.
 *     Covers the remaining ~20% of use cases.
 *
 * It progressively replaces the legacy jQuery modal system (.modal-open / .modal-active)
 * defined in modal.js, while coexisting with it during the migration period.
 *
 * ─── Simple dialog — no JS needed ────────────────────────────────────────────
 *
 *   Add an element with the .ui-dialog-open class and data-* attributes in PHP:
 *
 *     <div class="wpeo-button ui-dialog-open"
 *          id="btn-my-dialog"
 *          data-dialog-id="dialog-my-dialog"
 *          data-dialog-title="<?php echo $langs->trans('MyDialog'); ?>"
 *          data-dialog-icon="fas fa-my-icon"
 *          data-dialog-align="right"
 *          data-dialog-url="<?php echo dol_buildpath('/mymodule/core/tpl/modal/modal_my_dialog.tpl.php', 1); ?>">
 *         <span class="fas fa-my-icon"></span>
 *     </div>
 *
 * ─── Complex dialog — dedicated registerXxx() method ─────────────────────────
 *
 *   Create a window.saturne.uiDialogs.registerMyDialog() method below and
 *   call it from window.saturne.uiDialogs.event(). Use this when you need:
 *     - AJAX form submission (dol-dialog-ajax + onSuccess callback)
 *     - Custom footer (submitFormId, custom labels, alignment)
 *     - Any option that cannot be expressed as a plain string data-* attribute
 *
 * ─── Passing data to the modal PHP file ──────────────────────────────────────
 *
 *   In both cases, any data-* attribute on the element that is not prefixed with
 *   'dialog' is automatically forwarded as a query string parameter during the
 *   AJAX request (kebab-case → camelCase).
 *
 *     <element ... data-object-id="42" data-object-type="task">
 *
 *   Retrieve in PHP with GETPOST():
 *
 *     $objectId   = GETPOSTINT('objectId');
 *     $objectType = GETPOST('objectType', 'alpha');
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * Initializes the "uiDialogs" object along with the mandatory "init" method
 * required by the Saturne library.
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.uiDialogs = {};

/**
 * The method automatically called by the Saturne library.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.uiDialogs.init = function() {
  window.saturne.uiDialogs.event();
};

/**
 * The method containing all events for ui-dialogs.
 *
 * Loads required translation domains, auto-registers all simple dialogs via
 * register(), then calls each dedicated registerXxx() for complex dialogs.
 *
 * To add a new complex dialog: create a registerXxx() method below and call it here.
 * To add a new simple dialog: no change needed here — just add the button in PHP.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.uiDialogs.event = async function() {
  try {
    await Dolibarr.tools.langs.load('main');
    await Dolibarr.tools.langs.load('saturne');
  } catch (error) {
    console.warn('ui-dialogs.js: failed to load translation domains', error);
  }

  // ── Simple dialogs — auto-registered from .ui-dialog-open elements in the DOM.
  document.querySelectorAll('.ui-dialog-open').forEach(function(element) {
    window.saturne.uiDialogs.register(element);
  });

  // ── Complex dialogs — add registerXxx() calls here.
  window.saturne.uiDialogs.registerColumnOrder();
  // window.saturne.uiDialogs.registerMyForm();
};

/**
 * Generically registers a single uiDialog from a trigger element's data-* attributes.
 *
 * Used for simple dialogs: read-only content, no form submission, standard close
 * footer. All configuration is read from the element — no per-dialog JS needed.
 *
 * Supported data-dialog-* attributes on the element:
 *
 *   data-dialog-id         {string}   Required. Unique <dialog> DOM id.
 *   data-dialog-url        {string}   Required. AJAX URL to load the dialog content from.
 *   data-dialog-title      {string}   Optional. Dialog header title. No header if omitted.
 *   data-dialog-icon       {string}   Optional. FontAwesome class prefixed to the title.
 *   data-dialog-icon-color {string}   Optional. CSS color applied to the icon.
 *   data-dialog-align      {string}   Optional. 'center' (default) or 'right'.
 *   data-dialog-persist    {boolean}  Optional. Keep DOM after close. Default: true.
 *   data-dialog-animation  {boolean}  Optional. Enable animations. Default: true.
 *   data-dialog-width      {string}   Optional. Override CSS width (e.g. '600px', '50vw').
 *   data-dialog-height     {string}   Optional. Override CSS height (e.g. '400px', '50vh').
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @param  {HTMLElement} element  The trigger element to bind the dialog to.
 * @return {void}
 */
window.saturne.uiDialogs.register = function(element) {
  const dataset = element.dataset;

  // Guard: data-dialog-id and data-dialog-url are mandatory.
  if (!dataset.dialogId || !dataset.dialogUrl) {
    console.warn('ui-dialogs.js: missing data-dialog-id or data-dialog-url on', element);
    return;
  }

  // Ensure the element has an id so uiDialog can bind to it via CSS selector.
  if (!element.id) {
    element.id = 'ui-dialog-trigger-' + dataset.dialogId;
  }

  // Resolve footer options from data-dialog-footer attribute.
  // 'auto'   — default: show a Close button (standard read-only dialogs).
  // 'none'   — no footer rendered at all.
  // 'custom' — footer injected by the TPL itself via .dol-dialog-footer.
  const footerMode = dataset.dialogFooter || 'auto';
  let footer;

  if (footerMode === 'none') {
    footer = { showSubmit: false, showCancel: false };
  } else if (footerMode === 'custom') {
    footer = { showSubmit: false, showCancel: false };
  } else {
    footer = { showSubmit: false, cancelLabel: Dolibarr.tools.langs.trans('Close') };
  }

  Dolibarr.tools.uiDialog('#' + element.id, {
    dialogId   : dataset.dialogId,
    title      : dataset.dialogTitle     || '',
    icon       : dataset.dialogIcon      || '',
    icon_color : dataset.dialogIconColor || '',
    align      : dataset.dialogAlign     || 'center',
    url        : dataset.dialogUrl,
    persist    : dataset.dialogPersist   !== 'false',  // Default true unless explicitly 'false'.
    animation  : dataset.dialogAnimation !== 'false',  // Default true unless explicitly 'false'.
    width      : dataset.dialogWidth     || 0,
    height     : dataset.dialogHeight    || 0,
    footer     : footer,
  });
};

/**
 * Registers the column order management dialog.
 *
 * Complex dialog: requires JS initialization after AJAX content injection
 * (jQuery UI Sortable, stats counter) via the onLoad callback.
 *
 * onLoad is fired by ui-dialog.js after the AJAX content is injected into
 * the DOM — guaranteeing that #sortableColumns exists before columnManager
 * attempts to bind Sortable and compute stats.
 *
 * persist: true — content is kept in DOM after close to avoid re-initializing
 * Sortable on each opening. columnManager.event() binds on document so it
 * remains active regardless of DOM reinjection.
 *
 * Trigger element : #btn-column-order
 * Content file    : core/tpl/modal/modal_column_order_component.tpl.php
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.uiDialogs.registerColumnOrder = function() {
  var trigger = document.getElementById('btn-column-order');

  // Guard: trigger element may not exist on every page.
  if (!trigger) {
    return;
  }

  Dolibarr.tools.uiDialog('#btn-column-order', {
    dialogId : 'dialog-column-order',
    title    : Dolibarr.tools.langs.trans('ColumnOrder'),
    icon     : 'fas fa-list-ol',
    align    : 'right',
    width    : '300px',
    url      : trigger.dataset.dialogUrl,
    persist  : true,
    // footer   : {
    //   showSubmit  : false,
    //   cancelLabel : Dolibarr.tools.langs.trans('Close'),
    // },
    onLoad   : function(dialogEl, triggerData) {
      // Initialize Sortable, stats and direct element bindings
      // once AJAX content is in the DOM.
      window.saturne.columnManager.setup();
    },
  });
};

/**
 * — Complex dialog example —
 *
 * Copy this block to register a dialog that requires AJAX form submission,
 * a custom footer, onLoad or onSuccess callbacks.
 *
 * The url can be read from a data-dialog-url attribute on the trigger element
 * (same as simple dialogs), or from any other dataset property.
 *
 * window.saturne.uiDialogs.registerMyForm = function() {
 * 	var trigger = document.getElementById('btn-my-form');
 * 	if (!trigger) return;
 *
 * 	Dolibarr.tools.uiDialog('#btn-my-form', {
 * 		dialogId  : 'dialog-my-form',
 * 		title     : Dolibarr.tools.langs.trans('MyFormTitle'),
 * 		icon      : 'fas fa-my-icon',
 * 		align     : 'right',
 * 		url       : trigger.dataset.dialogUrl,
 * 		persist   : false,
 * 		footer    : {
 * 			submitFormId : 'my-form-id',
 * 			submitLabel  : Dolibarr.tools.langs.trans('Save'),
 * 			cancelLabel  : Dolibarr.tools.langs.trans('Cancel'),
 * 		},
 * 		onLoad    : function(dialogEl, triggerData) {
 * 			// JS initialization after content injection (e.g. select2, datepicker).
 * 		},
 * 		onSuccess : function(data) {
 * 			// Code executed after successful AJAX form submission.
 * 		},
 * 	});
 * };
 */
