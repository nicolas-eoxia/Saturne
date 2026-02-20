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
 * \file    core/tpl/actions/list_actions.tpl.php
 * \ingroup saturne
 * \brief   Template page for list actions
 */

/**
 * The following vars must be defined:
 * Global     : $conf, $db, $user,
 * Parameters : $action
 */

require_once DOL_DOCUMENT_ROOT . '/core/lib/functions2.lib.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($action == 'save_columns') {
    $columnOrder      = $data['column_order'] ?? [];
    $columnVisibility = $data['column_visibility'] ?? [];

    $tabParam['DIGIQUALI_QUESTION_COLUMN_ORDER_' . $user->id]      = json_encode($columnOrder);
    $tabParam['DIGIQUALI_QUESTION_COLUMN_VISIBILITY_' . $user->id] = json_encode($columnVisibility);

    dol_set_user_param($db, $conf, $user, $tabParam);
}

if ($action == 'reset_columns') {
    $tabParam['DIGIQUALI_QUESTION_COLUMN_ORDER_' . $user->id]      = '';
    $tabParam['DIGIQUALI_QUESTION_COLUMN_VISIBILITY_' . $user->id] = '';

    dol_set_user_param($db, $conf, $user, $tabParam);
}
