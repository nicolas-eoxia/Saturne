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
 * Library javascript to enable Browser notifications
 */

/**
 * \file    js/modules/columnManager.js
 * \ingroup saturne
 * \brief   JavaScript column manager file for module Saturne
 */

'use strict';

/**
 * Init column manager
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.columnManager = {};

/**
 * Column manager properties
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.columnManager.columns    = [];
window.saturne.columnManager.storageKey = 'digiquali_column_config';

/**
 * Column manager init
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.init = function init() {
  window.saturne.columnManager.loadColumns();
  window.saturne.columnManager.setupSortable();
  window.saturne.columnManager.event();
};

/**
 * Column manager event initialization. Binds all necessary event listeners
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.event = function initializeEvents() {
  // Toggle visibility
  $(document).on('change', '#sortableColumns input[type="checkbox"]', function() {
    var columnKey = $(this).closest('.column-item').data('key');
    var isVisible = $(this).is(':checked');
    window.saturne.columnManager.toggleColumnVisibility(columnKey, isVisible);
  });

  // Search
  $('#columnSearchInput').on('input', function() {
    window.saturne.columnManager.filterColumns($(this).val());
  });

  // Save
  $('#saveBtn').on('click', function() {
    window.saturne.columnManager.saveColumns();
  });

  // Reset
  $('#resetBtn').on('click', function() {
    window.saturne.columnManager.resetColumns();
  });
};

// ==========================================
// SORTABLE SETUP
// ==========================================

/**
 * Setup jQuery UI Sortable
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.setupSortable = function() {
  $('#sortableColumns').sortable({
    handle: '.drag-handle',
    placeholder: 'ui-state-highlight',
    cursor: 'move',
    axis: 'y',
    tolerance: 'pointer',

    start: function(event, ui) {
      console.log('🎯 Début drag:', ui.item.data('key'));
    },

    stop: function(event, ui) {
      console.log('✋ Fin drag:', ui.item.data('key'));
      window.saturne.columnManager.updateColumnOrder();
    },

    change: function(event, ui) {
      console.log('🔄 Changement position');
    }
  });

  console.log('✅ Sortable initialisé');
};

// ==========================================
// COLUMN MANAGEMENT
// ==========================================

/**
 * Load columns
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.loadColumns = function() {
  var saved = localStorage.getItem(window.saturne.columnManager.storageKey);

  if (saved) {
    try {
      window.saturne.columnManager.columns = JSON.parse(saved);
      console.log('✅ Colonnes chargées:', window.saturne.columnManager.columns.length);
    } catch (e) {
      console.error('❌ Erreur parsing:', e);
      window.saturne.columnManager.loadDefaultColumns();
    }
  } else {
    window.saturne.columnManager.loadDefaultColumns();
  }
};

/**
 * Load default columns
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.loadDefaultColumns = function() {
  window.saturne.columnManager.columns = [
    { key: 'technicalid', label: 'TechnicalID', field: 'TechnicalID', visible: true },
    { key: 'ref', label: 'Ref', field: 'Ref', visible: true },
    { key: 'label', label: 'Label', field: 'Label', visible: true },
    { key: 'description', label: 'Description', field: 'Description', visible: true },
    { key: 'numberofpoints', label: 'NumberOfPoints', field: 'NumberOfPoints', visible: true },
    { key: 'refext', label: 'RefExt', field: 'RefExt', visible: true },
    { key: 'entity', label: 'Entity', field: 'Entity', visible: true },
    { key: 'datecreation', label: 'DateCreation', field: 'DateCreation', visible: true },
    { key: 'datemodification', label: 'DateModification', field: 'DateModification', visible: true },
    { key: 'importid', label: 'ImportId', field: 'ImportId', visible: true },
    { key: 'status', label: 'Status', field: 'Status', visible: true },
    { key: 'type', label: 'Type', field: 'Type', visible: true },
    { key: 'showphoto', label: 'ShowPhoto', field: 'ShowPhoto', visible: false },
    { key: 'authorizeanswerphoto', label: 'AuthorizeAnswerPhoto', field: 'AuthorizeAnswerPhoto', visible: false },
    { key: 'entercomment', label: 'EnterComment', field: 'EnterComment', visible: false },
    { key: 'photook', label: 'PhotoOK', field: 'PhotoOK', visible: false },
    { key: 'photoko', label: 'PhotoKO', field: 'PhotoKO', visible: false },
    { key: 'json', label: 'JSON', field: 'JSON', visible: false },
    { key: 'userauthor', label: 'UserAuthor', field: 'UserAuthor', visible: false },
    { key: 'usermodif', label: 'UserModif', field: 'UserModif', visible: false }
  ];

  console.log('✅ Colonnes par défaut:', window.saturne.columnManager.columns.length);
};

/**
 * Render column list
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.renderColumnList = function() {
  var $list = $('#sortableColumns');
  $list.empty();

  $.each(window.saturne.columnManager.columns, function(index, column) {
    var checked = column.visible ? 'checked' : '';

    var $item = $('<li>', {
      'class': 'column-item',
      'data-key': column.key
    });

    var $dragHandle = $('<div>', { 'class': 'drag-handle' })
      .append($('<div>', { 'class': 'drag-line' }))
      .append($('<div>', { 'class': 'drag-line' }))
      .append($('<div>', { 'class': 'drag-line' }));

    var $columnInfo = $('<div>', { 'class': 'column-info' })
      .append($('<div>', { 'class': 'column-name', text: column.label }))
      .append($('<div>', { 'class': 'column-field', text: column.field }));

    var $toggle = $('<label>', { 'class': 'toggle-switch' })
      .append($('<input>', { type: 'checkbox', checked: column.visible }))
      .append($('<span>', { 'class': 'toggle-slider' }));

    $item.append($dragHandle).append($columnInfo).append($toggle);
    $list.append($item);
  });

  window.saturne.columnManager.updateStats();
  console.log('✅ Liste rendue');
};

/**
 * Update column order
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.updateColumnOrder = function() {
  var newOrder = [];

  $('#sortableColumns .column-item').each(function() {
    var columnKey = $(this).data('key');
    var column = $.grep(window.saturne.columnManager.columns, function(col) {
      return col.key === columnKey;
    })[0];

    if (column) {
      newOrder.push(column);
    }
  });

  window.saturne.columnManager.columns = newOrder;
  console.log('📋 Ordre mis à jour');
};

/**
 * Toggle column visibility
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param   {string} columnKey Column key
 * @param   {boolean} isVisible Visibility state
 * @return  {void}
 */
window.saturne.columnManager.toggleColumnVisibility = function(columnKey, isVisible) {
  var column = $.grep(window.saturne.columnManager.columns, function(col) {
    return col.key === columnKey;
  })[0];

  if (column) {
    column.visible = isVisible;
    window.saturne.columnManager.updateStats();
    console.log('👁️ Toggle:', columnKey, isVisible);
  }
};

/**
 * Filter columns
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param   {string} searchTerm Search term
 * @return  {void}
 */
window.saturne.columnManager.filterColumns = function(searchTerm) {
  var term = searchTerm.toLowerCase();

  $('#sortableColumns .column-item').each(function() {
    var $item = $(this);
    var label = $item.find('.column-name').text().toLowerCase();
    var field = $item.find('.column-field').text().toLowerCase();

    if (label.indexOf(term) !== -1 || field.indexOf(term) !== -1) {
      $item.show();
    } else {
      $item.hide();
    }
  });

  console.log('🔍 Filtrage:', searchTerm);
};

/**
 * Update stats
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.updateStats = function() {
  var visible = $.grep(window.saturne.columnManager.columns, function(col) {
    return col.visible;
  }).length;

  var hidden = $.grep(window.saturne.columnManager.columns, function(col) {
    return !col.visible;
  }).length;

  var total = window.saturne.columnManager.columns.length;

  $('#visibleCount').text(visible);
  $('#hiddenCount').text(hidden);
  $('#totalCount').text(total);

  console.log('📊 Stats:', visible, 'visibles,', hidden, 'cachées');
};

// ==========================================
// SAVE / RESET
// ==========================================

/**
 * Save columns
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.saveColumns = function() {
  window.saturne.columnManager.updateColumnOrder();

  localStorage.setItem(
    window.saturne.columnManager.storageKey,
    JSON.stringify(window.saturne.columnManager.columns)
  );

  console.log('✅ Configuration sauvegardée');

  window.saturne.columnManager.closeModal();
  alert('Configuration des colonnes sauvegardée !');
};

/**
 * Reset columns
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnManager.resetColumns = function() {
  if (confirm('Voulez-vous vraiment réinitialiser ?')) {
    localStorage.removeItem(window.saturne.columnManager.storageKey);
    window.saturne.columnManager.loadDefaultColumns();
    window.saturne.columnManager.renderColumnList();

    console.log('🔄 Colonnes réinitialisées');
  }
};
