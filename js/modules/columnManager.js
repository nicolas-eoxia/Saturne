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
 * Library javascript to manage column order and visibility
 */

/**
 * \file    js/modules/columnManager.js
 * \ingroup saturne
 * \brief   JavaScript column manager file for module Saturne
 */

'use strict';

/**
 * Initializes the "columnManager" object along with the mandatory "init" method
 * required by the Saturne library.
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.columnManager = {};

/**
 * Debounce timer for auto-save — prevents flooding the server with requests
 * when the user drags or toggles visibility rapidly.
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.columnManager.saveTimeout = null;

/**
 * The method automatically called by the Saturne library.
 *
 * Only binds delegated events on document — DOM elements are not yet available
 * at this point. All direct DOM bindings and JS initializations are deferred
 * to setup(), called by ui-dialogs.js onLoad after AJAX content injection.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.init = function() {
  window.saturne.columnManager.event();
};

/**
 * The method containing all delegated events for the column manager.
 *
 * Uses event delegation on document so bindings remain active regardless
 * of when the dialog content is injected or removed from the DOM.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.event = function() {
  // Auto-save on visibility toggle — delegated, works before DOM injection.
  $(document).on('change', '#sortableColumns .toggle input[type="checkbox"]', function() {
    window.saturne.columnManager.updateStats();
    window.saturne.columnManager.saveColumns(true, 500);
  });
};

/**
 * Sets up the column manager after AJAX content injection.
 *
 * Called by ui-dialogs.js onLoad callback once the dialog content is injected
 * into the DOM. Binds direct element listeners and initializes Sortable and
 * stats — all of which require #sortableColumns, #saveBtn, #resetBtn and
 * #columnSearchInput to exist in the DOM first.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.setup = function() {
  // Bind directly now that DOM elements exist.
  $('#columnSearchInput').on('input', function() {
    window.saturne.columnManager.filterColumns($(this).val());
  });

  $('#saveBtn').on('click', function() {
    window.saturne.columnManager.saveColumns(false);
  });

  $('#resetBtn').on('click', function() {
    window.saturne.columnManager.resetColumns();
  });

  window.saturne.columnManager.setupSortable();
  window.saturne.columnManager.updateStats();
};

/**
 * Initializes jQuery UI Sortable on the column list.
 *
 * Uses forcePlaceholderSize and a start callback to ensure the placeholder
 * always matches the dragged item's height, preventing layout jumps.
 * The revert option animates the item back to its original position if the
 * drop is cancelled.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.setupSortable = function() {
  $('#sortableColumns').sortable({
    handle               : '.drag-handle',
    placeholder          : 'column-item ui-state-highlight',
    cursor               : 'grabbing',
    axis                 : 'y',
    tolerance            : 'pointer',
    opacity              : 1,     // Opacity managed by CSS.
    revert               : 150,   // Smooth animation back on cancelled drop.
    forcePlaceholderSize : true,  // Placeholder keeps the dragged item height.

    start: function(event, ui) {
      ui.placeholder.height(ui.item.outerHeight());
    },

    stop: function(event, ui) {
      window.saturne.columnManager.saveColumns(true, 500);
    },
  });
};

/**
 * Returns the current column order from the DOM.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {Array} Ordered array of column keys.
 */
window.saturne.columnManager.getColumnOrder = function() {
  var order = [];

  $('#sortableColumns .column-item').each(function() {
    order.push($(this).data('key'));
  });

  return order;
};

/**
 * Returns the current column visibility state from the DOM.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {Object} Object mapping column keys to their visibility boolean.
 */
window.saturne.columnManager.getColumnVisibility = function() {
  var visibility = {};

  $('#sortableColumns .column-item').each(function() {
    var key       = $(this).data('key');
    var isVisible = $(this).find('.toggle input[type="checkbox"]').is(':checked');
    visibility[key] = isVisible;
  });

  return visibility;
};

/**
 * Filters the column list by search term.
 *
 * Hides items whose label or field name does not match the search term.
 * Matching is case-insensitive and covers both .column-name and .column-field.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @param  {string} searchTerm  The search string typed by the user.
 * @return {void}
 */
window.saturne.columnManager.filterColumns = function(searchTerm) {
  var term = searchTerm.toLowerCase();

  $('#sortableColumns .column-item').each(function() {
    var $item = $(this);
    var label = $item.find('.column-name').text().toLowerCase();
    var field = $item.find('.column-field').text().toLowerCase();

    if (label.indexOf(term) !== -1 || field.indexOf(term) !== -1) {
      $item.removeClass('hidden');
    } else {
      $item.addClass('hidden');
    }
  });
};

/**
 * Updates the visible/hidden/total stats counters in the dialog footer.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.updateStats = function() {
  var visible = $('#sortableColumns .toggle input[type="checkbox"]:checked').length;
  var total   = $('#sortableColumns .column-item').length;
  var hidden  = total - visible;

  $('#visibleCount').text(visible);
  $('#hiddenCount').text(hidden);
  $('#totalCount').text(total);
};

/**
 * Saves column configuration with optional debounce.
 *
 * In silent mode (auto-save after drag/toggle), the save is debounced by
 * the given delay to avoid flooding the server with rapid successive calls.
 * In normal mode (save button), the save executes immediately.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @param  {boolean} silent  If true, no page reload. Default: false.
 * @param  {number}  delay   Debounce delay in ms. Default: 500.
 * @return {void}
 */
window.saturne.columnManager.saveColumns = function(silent, delay) {
  silent = silent || false;
  delay  = delay  || 500;

  // Cancel any pending debounced save.
  if (window.saturne.columnManager.saveTimeout) {
    clearTimeout(window.saturne.columnManager.saveTimeout);
  }

  // Immediate save when triggered by the save button.
  if (!silent) {
    window.saturne.columnManager.executeSave(silent);
    return;
  }

  // Debounced save when triggered by drag or visibility toggle.
  window.saturne.columnManager.saveTimeout = setTimeout(function() {
    window.saturne.columnManager.executeSave(silent);
  }, delay);
};

/**
 * Executes the AJAX save request for column order and visibility.
 *
 * Sends a POST request to the current page URL with action=save_columns.
 * On success in normal mode, reloads the page to reflect the new column order.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @param  {boolean} silent  If true, no page reload after save.
 * @return {void}
 */
window.saturne.columnManager.executeSave = function(silent) {
  var columnOrder      = window.saturne.columnManager.getColumnOrder();
  var columnVisibility = window.saturne.columnManager.getColumnVisibility();
  var token            = window.saturne.toolbox.getToken();
  var querySeparator   = window.saturne.toolbox.getQuerySeparator(document.URL);
  var ajaxUrl          = document.URL + querySeparator + 'action=save_columns&token=' + token;

  $.ajax({
    url         : ajaxUrl,
    method      : 'POST',
    contentType : 'application/json',
    data        : JSON.stringify({
      column_order      : columnOrder,
      column_visibility : columnVisibility,
    }),
    success: function(response) {
      if (!silent) {
        location.reload();
      }
    },
    error: function(xhr, status, error) {
      if (!silent) {
        window.saturne.toolbox.displayNotification('error', 'ErrorSavingColumns');
      }
    },
  });
};

/**
 * Resets column order and visibility to default values.
 *
 * Sends a POST request to the current page URL with action=reset_columns,
 * then reloads the page to reflect the reset state.
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.resetColumns = function() {
  var token          = window.saturne.toolbox.getToken();
  var querySeparator = window.saturne.toolbox.getQuerySeparator(document.URL);
  var ajaxUrl        = document.URL + querySeparator + 'action=reset_columns&token=' + token;

  $.ajax({
    url    : ajaxUrl,
    method : 'POST',
    data   : { action: 'reset_columns' },
    success: function() {
      location.reload();
    },
  });
};
