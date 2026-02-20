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
window.saturne.columnManager.saveTimeout = null;

/**
 * Column manager init
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.columnManager.init = function init() {
  window.saturne.columnManager.event();
  window.saturne.columnManager.setupSortable();
  window.saturne.columnManager.updateStats();
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
    window.saturne.columnManager.updateStats();
    window.saturne.columnManager.saveColumns(true, 500);
  });

  // Search
  $('#columnSearchInput').on('input', function() {
    window.saturne.columnManager.filterColumns($(this).val());
  });

  // Save
  $('#saveBtn').on('click', function() {
    window.saturne.columnManager.saveColumns(false);
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
      window.saturne.columnManager.saveColumns(true, 500);
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
 * Get column order from DOM
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {array} Array of column keys
 */
window.saturne.columnManager.getColumnOrder = function() {
  var order = [];

  $('#sortableColumns .column-item').each(function() {
    order.push($(this).data('key'));
  });

  return order;
};

// /**
//  * Update column order
//  *
//  * @since   1.0.0
//  * @version 1.0.0
//  *
//  * @return {void}
//  */
// window.saturne.columnManager.updateColumnOrder = function() {
//   var newOrder = [];
//
//   $('#sortableColumns .column-item').each(function() {
//     var columnKey = $(this).data('key');
//     var column = $.grep(window.saturne.columnManager.columns, function(col) {
//       return col.key === columnKey;
//     })[0];
//
//     if (column) {
//       newOrder.push(column);
//     }
//   });
//
//   window.saturne.columnManager.columns = newOrder;
//   console.log('📋 Ordre mis à jour');
//
//     $.ajax({
//         url: '/custom/saturne/ajax/updateColumnOrder.php',
//         method: 'POST',
//         data: { columns: window.saturne.columnManager.columns },
//         success: function(response) {
//         console.log('✅ Ordre sauvegardé en base');
//         },
//         error: function(xhr, status, error) {
//         console.error('❌ Erreur sauvegarde ordre:', error);
//         }
//     });
// };

/**
 * Get column visibility from DOM
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {object} Object with column keys and visibility
 */
window.saturne.columnManager.getColumnVisibility = function() {
  var visibility = {};

  $('#sortableColumns .column-item').each(function() {
    var key = $(this).data('key');
    var isVisible = $(this).find('input[type="checkbox"]').is(':checked');
    visibility[key] = isVisible;
  });

  return visibility;
};

// /**
//  * Toggle column visibility
//  *
//  * @since   1.0.0
//  * @version 1.0.0
//  *
//  * @param   {string} columnKey Column key
//  * @param   {boolean} isVisible Visibility state
//  * @return  {void}
//  */
// window.saturne.columnManager.toggleColumnVisibility = function(columnKey, isVisible) {
//   var column = $.grep(window.saturne.columnManager.columns, function(col) {
//     return col.key === columnKey;
//   })[0];
//
//   if (column) {
//     column.visible = isVisible;
//     window.saturne.columnManager.updateStats();
//     console.log('👁️ Toggle:', columnKey, isVisible);
//   }
// };

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
      $item.removeClass('hidden');
    } else {
      $item.addClass('hidden');
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
  var visible = $('#sortableColumns input[type="checkbox"]:checked').length;
  var total = $('#sortableColumns .column-item').length;
  var hidden = total - visible;

  $('#visibleCount').text(visible);
  $('#hiddenCount').text(hidden);
  $('#totalCount').text(total);

  console.log('📊 Stats:', visible, 'visibles,', hidden, 'cachées');
};

// ==========================================
// SAVE / RESET
// ==========================================

// /**
//  * Save columns
//  *
//  * @since   1.0.0
//  * @version 1.0.0
//  *
//  * @return {void}
//  */
// window.saturne.columnManager.saveColumns = function() {
//   window.saturne.columnManager.updateColumnOrder();
//
//   localStorage.setItem(
//     window.saturne.columnManager.storageKey,
//     JSON.stringify(window.saturne.columnManager.columns)
//   );
//
//   console.log('✅ Configuration sauvegardée');
//
//   window.saturne.columnManager.closeModal();
//   alert('Configuration des colonnes sauvegardée !');
// };

/**
 * Save columns avec debounce
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param   {boolean} silent Si true, pas de notification ni rechargement
 * @param   {number}  delay  Délai en ms avant la sauvegarde (défaut: 500)
 * @return {void}
 */
window.saturne.columnManager.saveColumns = function(silent, delay) {
  silent = silent || false;
  delay = delay || 500; // 500ms par défaut

  // Annuler la sauvegarde précédente si elle existe
  if (window.saturne.columnManager.saveTimeout) {
    clearTimeout(window.saturne.columnManager.saveTimeout);
  }

  // Si mode normal (bouton), sauvegarder immédiatement
  if (!silent) {
    window.saturne.columnManager.executeSave(silent);
    return;
  }

  // Si mode silent (auto-save), attendre le délai
  window.saturne.columnManager.saveTimeout = setTimeout(function() {
    window.saturne.columnManager.executeSave(silent);
  }, delay);
};

/**
 * Execute save (fonction interne)
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param   {boolean} silent Si true, pas de notification ni rechargement
 * @return {void}
 */
window.saturne.columnManager.executeSave = function(silent) {
  var columnOrder = window.saturne.columnManager.getColumnOrder();
  var columnVisibility = window.saturne.columnManager.getColumnVisibility();

  let token          = window.saturne.toolbox.getToken();
  let querySeparator = window.saturne.toolbox.getQuerySeparator(document.URL);

  console.log('💾 Sauvegarde en cours...');

  var ajaxUrl = document.URL + querySeparator + 'action=save_columns&token=' + token;

  $.ajax({
    url: ajaxUrl,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      column_order: columnOrder,
      column_visibility: columnVisibility
    }),
    success: function(response) {
      var $newTable = $(response).find('.div-table-responsive');
      $('.div-table-responsive').replaceWith($newTable);

      if (!silent) {
        window.saturne.columnManager.closeModal();
        location.reload();
      }
    },
    error: function(xhr, status, error) {
      console.error('❌ Erreur sauvegarde:', error);

      if (!silent) {
        alert('Erreur lors de la sauvegarde');
      }
    }
  });
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
  // if (confirm('Voulez-vous vraiment réinitialiser ?')) {
  //   localStorage.removeItem(window.saturne.columnManager.storageKey);
  //   window.saturne.columnManager.loadDefaultColumns();
  //   window.saturne.columnManager.renderColumnList();
  //
  //   console.log('🔄 Colonnes réinitialisées');
  // }

  if (confirm('Voulez-vous vraiment réinitialiser ?')) {
    $.ajax({
      url: 'ajax/save_columns.php', // À adapter
      method: 'POST',
      data: {
        action: 'reset_columns'
      },
      success: function(response) {
        console.log('🔄 Colonnes réinitialisées');
        location.reload();
      },
      error: function(xhr, status, error) {
        console.error('❌ Erreur réinitialisation:', error);
      }
    });
  }
};
