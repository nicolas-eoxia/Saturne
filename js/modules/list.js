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
 * \file    js/modules/list.js
 * \ingroup saturne
 * \brief   JavaScript list file for module Saturne
 */

'use strict';

/**
 * Init list JS
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.list = {};

/**
 * list properties
 *
 * @since   22.1.0
 * @version 22.1.0
 */
window.saturne.list.columnOrder = [];
window.saturne.list.tableId = '#dataTable';
window.saturne.list.headerSelector = '#tableHeader';

/**
 * List init
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.list.init = function init() {
  window.saturne.list.loadColumnOrder();
  window.saturne.list.setupDragDrop();
  window.saturne.list.setupResize();
  window.saturne.list.event();
};

/**
 * List event initialization. Binds all necessary event listeners
 *
 * @since   22.1.0
 * @version 22.1.0
 *
 * @return {void}
 */
window.saturne.list.event = function initializeEvents() {
};

// ==========================================
// DRAG & DROP COLONNES
// ==========================================

/**
 * Setup column drag and drop with jQuery UI Sortable
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.setupDragDrop = function() {
  $(window.saturne.list.headerSelector).sortable({
    items: 'th[data-column]',           // Seulement les colonnes avec data-column
    handle: '.column-header',            // Drag par l'en-tête uniquement
    helper: 'clone',                     // Clone visuel pendant le drag
    axis: 'x',                          // Mouvement horizontal uniquement
    cursor: 'move',                     // Curseur pendant le drag
    placeholder: 'column-placeholder',   // Classe pour l'emplacement cible
    tolerance: 'pointer',               // Détection basée sur le pointeur

    start: function(event, ui) {
      console.log('🎯 Début drag colonne:', ui.item.data('column'));
      ui.placeholder.height(ui.item.height());
      ui.item.addClass('dragging-column');
    },

    stop: function(event, ui) {
      console.log('✋ Fin drag colonne:', ui.item.data('column'));
      ui.item.removeClass('dragging-column');

      // Sauvegarder le nouvel ordre
      window.saturne.list.updateColumnOrder();
      window.saturne.list.saveColumnOrder();

      // Re-render le tableau avec le nouvel ordre
      window.saturne.list.reorderTableCells();
    },

    change: function(event, ui) {
      console.log('🔄 Changement position colonne');
    }
  });

  console.log('✅ Drag & Drop colonnes initialisé');
};

/**
 * Update column order from DOM
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.updateColumnOrder = function() {
  window.saturne.list.columnOrder = [];

  $(window.saturne.list.headerSelector + ' th[data-column]').each(function() {
    const columnName = $(this).data('column');
    window.saturne.list.columnOrder.push(columnName);
  });

  console.log('📋 Nouvel ordre des colonnes:', window.saturne.list.columnOrder);
};

/**
 * Reorder table cells to match header order
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.reorderTableCells = function() {
  const $tbody = $(window.saturne.list.tableId + ' tbody');

  $tbody.find('tr').each(function() {
    const $row = $(this);
    const $cells = $row.find('td[data-column]');

    // Créer un map des cellules par colonne
    const cellMap = {};
    $cells.each(function() {
      const columnName = $(this).data('column');
      cellMap[columnName] = $(this);
    });

    // Réorganiser les cellules selon columnOrder
    window.saturne.list.columnOrder.forEach(function(columnName) {
      if (cellMap[columnName]) {
        $row.append(cellMap[columnName]);
      }
    });
  });

  console.log('✅ Cellules réorganisées');
};

// ==========================================
// SAUVEGARDE
// ==========================================

/**
 * Save column order to localStorage and database
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.saveColumnOrder = function() {
  // 1. Sauvegarder dans localStorage (immédiat)
  localStorage.setItem('digiquali_column_order', JSON.stringify(window.saturne.list.columnOrder));
  console.log('✅ Ordre colonnes sauvegardé (localStorage)');

  // 2. Sauvegarder en base de données (optionnel)
  $.ajax({
    url: window.saturne.list.getAjaxUrl('save_user_preference'),
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      preference_key: 'question_column_order',
      preference_value: JSON.stringify(window.saturne.list.columnOrder)
    }),
    success: function(response) {
      if (response.success) {
        console.log('✅ Ordre colonnes sauvegardé (BDD)');
      } else {
        console.warn('⚠️ Erreur sauvegarde BDD:', response.error);
      }
    },
    error: function(xhr, status, error) {
      console.log('ℹ️ Sauvegarde BDD non disponible, localStorage utilisé');
    }
  });
};

/**
 * Load column order from localStorage
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.loadColumnOrder = function() {
  const saved = localStorage.getItem('digiquali_column_order');

  if (saved) {
    try {
      window.saturne.list.columnOrder = JSON.parse(saved);
      console.log('✅ Ordre colonnes chargé:', window.saturne.list.columnOrder);

      // Appliquer l'ordre sauvegardé
      window.saturne.list.applyColumnOrder();
    } catch (e) {
      console.error('❌ Erreur parsing ordre colonnes:', e);
      window.saturne.list.columnOrder = [];
    }
  } else {
    // Initialiser avec l'ordre actuel du DOM
    window.saturne.list.updateColumnOrder();
  }
};

/**
 * Apply saved column order to table
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.applyColumnOrder = function() {
  if (!window.saturne.list.columnOrder || window.saturne.list.columnOrder.length === 0) {
    return;
  }

  const $header = $(window.saturne.list.headerSelector);
  const $columns = $header.find('th[data-column]');

  // Créer un map des colonnes
  const columnMap = {};
  $columns.each(function() {
    const columnName = $(this).data('column');
    columnMap[columnName] = $(this);
  });

  // Trouver le dernier th avant les colonnes data-column (checkboxes, drag handle, etc.)
  const $lastFixedColumn = $header.find('th:not([data-column])').last();

  // Réorganiser les colonnes selon l'ordre sauvegardé
  window.saturne.list.columnOrder.forEach(function(columnName) {
    if (columnMap[columnName]) {
      if ($lastFixedColumn.length > 0) {
        columnMap[columnName].insertAfter($lastFixedColumn);
      } else {
        $header.append(columnMap[columnName]);
      }
    }
  });

  // Réorganiser les cellules du tbody
  window.saturne.list.reorderTableCells();

  console.log('✅ Ordre colonnes appliqué');
};

// ==========================================
// REDIMENSIONNEMENT COLONNES
// ==========================================

/**
 * Setup column resize functionality
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.setupResize = function() {
  $('th[data-column]').each(function() {
    const $th = $(this);
    const $handle = $th.find('.resize-handle');

    if ($handle.length === 0) {
      // Créer le handle s'il n'existe pas
      $th.append('<div class="resize-handle"></div>');
    }

    let startX, startWidth;

    $th.find('.resize-handle').on('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Empêcher le drag de la colonne

      startX = e.pageX;
      startWidth = $th.width();

      // Ajouter classe pendant le resize
      $th.addClass('resizing');

      $(document).on('mousemove.resize', function(e) {
        const width = startWidth + (e.pageX - startX);
        if (width > 50) { // Largeur minimale
          $th.css('width', width + 'px');
        }
      });

      $(document).on('mouseup.resize', function() {
        $(document).off('.resize');
        $th.removeClass('resizing');

        // Sauvegarder la largeur
        window.saturne.list.saveColumnWidths();
      });
    });
  });

  // Charger les largeurs sauvegardées
  window.saturne.list.loadColumnWidths();

  console.log('✅ Redimensionnement colonnes initialisé');
};

/**
 * Save column widths to localStorage
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.saveColumnWidths = function() {
  const widths = {};

  $('th[data-column]').each(function() {
    const columnName = $(this).data('column');
    const width = $(this).width();
    widths[columnName] = width;
  });

  localStorage.setItem('digiquali_column_widths', JSON.stringify(widths));
  console.log('✅ Largeurs colonnes sauvegardées:', widths);
};

/**
 * Load column widths from localStorage
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.list.loadColumnWidths = function() {
  const saved = localStorage.getItem('digiquali_column_widths');

  if (saved) {
    try {
      const widths = JSON.parse(saved);

      $('th[data-column]').each(function() {
        const columnName = $(this).data('column');
        if (widths[columnName]) {
          $(this).css('width', widths[columnName] + 'px');
        }
      });

      console.log('✅ Largeurs colonnes chargées:', widths);
    } catch (e) {
      console.error('❌ Erreur parsing largeurs colonnes:', e);
    }
  }
};

/**
 * Reset column order to default
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.saturne.columnDrag.resetColumnOrder = function() {
  localStorage.removeItem('digiquali_column_order');
  localStorage.removeItem('digiquali_column_widths');

  console.log('🔄 Ordre colonnes réinitialisé');
  location.reload();
};

/**
 * Set table and header selectors
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param   {string} tableId Table ID selector
 * @param   {string} headerId Header ID selector
 * @return  {void}
 */
window.saturne.columnDrag.setSelectors = function(tableId, headerId) {
  window.saturne.columnDrag.tableId = tableId;
  window.saturne.columnDrag.headerSelector = headerId;
};

