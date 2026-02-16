<?php
/* Copyright (C) 2026 EVARISK <technique@evarisk.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * \file    core/tpl/modal/modal_column_order_component.tpl.php
 * \ingroup saturne
 * \brief   Template page for modal column order component
 */

/**
 * The following vars must be defined:
 * Global   : $langs
 * Objects  : $object
 * Variable : $taskNextValue
 */ ?>

<div class="wpeo-modal modal-column-order-component" id="column_order_component">
    <div class="modal-container wpeo-modal-event">
        <!-- Modal-Header -->
        <div class="modal-header">
            <h2 class="modal-title"></h2>
            <?php
                echo saturne_get_modal_header_recap_html([
                    'iconClass' => 'fas fa-cog', // L'icône que vous voulez pour le header
                    'title'     => 'test',       // Le nom du fournisseur/entité
                ]);
            ?>
            <div class="modal-close"><i class="fas fa-2x fa-times"></i></div>
        </div>
        <!-- Modal-Content -->
        <div class="modal-content">
            <!-- Search -->
            <div class="column-search">
                <span class="search-icon">🔍</span>
                <input type="text" id="columnSearchInput" placeholder="Rechercher une colonne...">
            </div>

            <!-- Column List -->
            <ul class="column-list" id="sortableColumns">
                <?php foreach ($object->fields as $key => $value) { ?>
                    <li class="column-item" data-column-name="<?php echo $key; ?>">
                        <span class="drag-handle">☰</span>
                        <span class="column-name"><?php echo $value['label']; ?></span>
                        <span class="visibility-toggle">
                            <input type="checkbox" class="visibility-checkbox" checked>
                        </span>
                    </li>
                <?php } ?>
            </ul>

            <!-- Stats -->
            <div class="column-stats">
                <div class="stat-item">
                    <span>Visibles:</span>
                    <span class="stat-value" id="visibleCount">0</span>
                </div>
                <div class="stat-item">
                    <span>Cachées:</span>
                    <span class="stat-value" id="hiddenCount">0</span>
                </div>
                <div class="stat-item">
                    <span>Total:</span>
                    <span class="stat-value" id="totalCount">0</span>
                </div>
            </div>
        </div>
        <!-- Modal-Footer -->
        <div class="modal-footer">
            <button class="btn btn-secondary" id="resetBtn">
                🔄 Réinitialiser
            </button>
            <button class="btn btn-primary" id="saveBtn">
                💾 Sauvegarder
            </button>
        </div>
    </div>
</div>
