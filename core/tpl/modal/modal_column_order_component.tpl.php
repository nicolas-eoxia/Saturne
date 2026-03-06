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
 * \brief   Template page for modal column order component.
 *
 * This file is loaded via AJAX by ui-dialog.js — it must return only the
 * inner content of the dialog. The <dialog> wrapper, header, and footer
 * are managed by ui-dialog.js from the data-* attributes on the trigger element.
 *
 * The following data-* attributes must be set on the trigger element:
 *   data-object-type  {string}  Object type (e.g. 'question').
 *   data-module       {string}  Module name (e.g. 'digiquali').
 */

// Load Saturne environment.
$res = 0;
for ($i = 1; $i <= 10; $i++) {
    $path = str_repeat('../', $i);
    if (!$res && file_exists($path . 'saturne.main.inc.php')) {
        $res = @include $path . 'saturne.main.inc.php';
    }
}
if (!$res) die('Include of saturne main fails');

// Global variables definitions.
global $langs, $user;

// Load translation files required by the page.
saturne_load_langs();

// Get parameters.
$objectType = GETPOST('objectType');
$module     = GETPOST('module');

// Build the user param prefix — e.g. 'DIGIQUALI_QUESTION'.
$prefix = strtoupper($module) . '_' . strtoupper($objectType);

// Load object to get fields definition.
$object = fetchObjectByElement(0, $objectType);

// Load saved column order and visibility for the current user.
$savedOrder      = getDolUserString($prefix . '_COLUMN_ORDER_' . $user->id);
$savedVisibility = getDolUserString($prefix . '_COLUMN_VISIBILITY_' . $user->id);

$order      = !empty($savedOrder)      ? json_decode($savedOrder, true)      : [];
$visibility = !empty($savedVisibility) ? json_decode($savedVisibility, true) : [];

// Apply saved order — append unsaved columns at the end.
if (!empty($order)) {
    $orderedFields = [];
    foreach ($order as $key) {
        if (isset($object->fields[$key])) {
            $orderedFields[$key] = $object->fields[$key];
        }
    }
    foreach ($object->fields as $key => $field) {
        if (!isset($orderedFields[$key])) {
            $orderedFields[$key] = $field;
        }
    }
    $object->fields = $orderedFields;
}

// Split fields into visible and hidden groups.
$visibleFields = [];
$hiddenFields  = [];

foreach ($object->fields as $key => $field) {
    // Default to visible if no saved state exists for this column.
    $isVisible = isset($visibility[$key]) ? (bool) $visibility[$key] : true;
    if ($isVisible) {
        $visibleFields[$key] = $field;
    } else {
        $hiddenFields[$key] = $field;
    }
}

/**
 * Renders a single column item <li>.
 *
 * @param string    $key      Field key.
 * @param array     $field    Field definition array.
 * @param bool      $checked  Whether the toggle is checked (visible).
 * @param Translate $langs    Translation object.
 */
function renderColumnItem(string $key, array $field, bool $checked, Translate $langs): void
{
    $checkedAttr = $checked ? ' checked' : '';
    $type        = $field['type'] ?? 'varchar';
    $picto       = getPictoForType($type, 'column-type-icon');

    echo '<li class="column-item" data-key="' . dol_escape_htmltag($key) . '">';
    echo '<span class="drag-handle">';
    echo '<span class="drag-dot-row"><span class="drag-dot"></span><span class="drag-dot"></span></span>';
    echo '<span class="drag-dot-row"><span class="drag-dot"></span><span class="drag-dot"></span></span>';
    echo '<span class="drag-dot-row"><span class="drag-dot"></span><span class="drag-dot"></span></span>';
    echo '</span>';
    echo '<span class="column-type">' . $picto . '</span>';
    echo '<span class="column-name">' . dol_escape_htmltag($langs->trans($field['label'])) . '</span>';
    echo '<label class="toggle">';
    echo '<input type="checkbox" class="visibility-checkbox"' . $checkedAttr . '>';
    echo '<span class="toggle-track"></span>';
    echo '<span class="toggle-thumb"></span>';
    echo '</label>';
    echo '</li>';
}
?>

<!-- Search -->
<div class="column-search">
    <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input type="text" id="columnSearchInput" placeholder="<?php echo $langs->trans('SearchColumn'); ?>">
</div>

<!-- Column list -->
<ul class="column-list" id="sortableColumns">

    <?php if (!empty($visibleFields)) { ?>
        <li class="column-section-label"><?php echo $langs->trans('Visible'); ?></li>
        <?php foreach ($visibleFields as $key => $field) {
            renderColumnItem($key, $field, true, $langs);
        } ?>
    <?php } ?>

    <?php if (!empty($hiddenFields)) { ?>
        <li class="column-section-divider"></li>
        <li class="column-section-label"><?php echo $langs->trans('Hidden'); ?></li>
        <?php foreach ($hiddenFields as $key => $field) {
            renderColumnItem($key, $field, false, $langs);
        } ?>
    <?php } ?>

</ul>

<!-- Footer — moved outside the scrollable area by ui-dialog.js -->
<div class="dol-dialog-footer column-manager-footer">
    <!-- Stats inside footer so they stay fixed below the list -->
    <div class="column-stats">
        <div class="stat-item">
            <span><?php echo $langs->trans('Visible'); ?></span>
            <span class="stat-value" id="visibleCount">0</span>
        </div>
        <span class="stat-sep">·</span>
        <div class="stat-item">
            <span><?php echo $langs->trans('Hidden'); ?></span>
            <span class="stat-value" id="hiddenCount">0</span>
        </div>
        <span class="stat-sep">·</span>
        <div class="stat-item">
            <span><?php echo $langs->trans('Total'); ?></span>
            <span class="stat-value" id="totalCount">0</span>
        </div>
    </div>
    <div class="column-manager-actions">
        <button type="button" class="cm-btn cm-btn-reset" id="resetBtn">
            <?php echo $langs->trans('Reset'); ?>
        </button>
        <button type="button" class="cm-btn cm-btn-save" id="saveBtn">
            <?php echo $langs->trans('Save'); ?>
        </button>
    </div>
</div>
