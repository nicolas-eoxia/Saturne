<?php

/* Copyright (C) 2021-2023 EVARISK <technique@evarisk.com>
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
 */

require_once __DIR__ . '/medias.lib.php';
require_once __DIR__ . '/pagination.lib.php';
require_once __DIR__ . '/documents.lib.php';

/**
 *      Print llxHeader with Saturne custom enhancements
 *
 *      @param      integer				$load_media_gallery		Load media gallery on page
 *      @param      string				$head					Show header
 *      @param      string				$title					Page title
 *      @param      string				$help_url				Help url shown in "?" tooltip
 *      @param      string				$target					Target to use on links
 *      @param      integer				$disablejs				More content into html header
 *      @param      integer				$disablehead			More content into html header
 * 		@param		array				$arrayofjs				Array of complementary js files
 * 		@param		array				$arrayofcss				Array of complementary css files
 * 		@param		string				$morequerystring		Query string to add to the link "print" to get same parameters (use only if autodetect fails)
 * 		@param		string				$morecssonbody			More CSS on body tag. For example 'classforhorizontalscrolloftabs'.
 * 		@param		string				$replacemainareaby		Replace call to main_area() by a print of this string
 * 		@param		integer				$disablenofollow		Disable the "nofollow" on meta robot header
 * 		@param		integer				$disablenoindex			Disable the "noindex" on meta robot header
 */
function saturne_header($load_media_gallery = 0, $head = '', $title = '', $help_url = '', $target = '', $disablejs = 0, $disablehead = 0, $arrayofjs = [], $arrayofcss = [], $morequerystring = '', $morecssonbody = '', $replacemainareaby = '', $disablenofollow = 0, $disablenoindex = 0) {

	global $langs, $moduleNameLowerCase;

	//CSS
	$arrayofcss[] = '/saturne/css/saturne.css';
    if (file_exists(__DIR__ . '/../../' . $moduleNameLowerCase . '/css/' . $moduleNameLowerCase . '.css')) {
        $arrayofcss[] = '/' . $moduleNameLowerCase . '/css/' . $moduleNameLowerCase . '.css';
    }

	//JS
	$arrayofjs[] = '/saturne/js/saturne.min.js';
    if (file_exists(__DIR__ . '/../../' . $moduleNameLowerCase . '/js/' . $moduleNameLowerCase . '.min.js')) {
        $arrayofjs[] = '/' . $moduleNameLowerCase . '/js/' . $moduleNameLowerCase . '.min.js';
    }

	llxHeader($head, $title, $help_url, $target, $disablejs, $disablehead, $arrayofjs, $arrayofcss, $morequerystring, $morecssonbody, $replacemainareaby, $disablenofollow, $disablenoindex);

	if ($load_media_gallery) {
		//Media gallery
		include __DIR__ . '/../core/tpl/medias/medias_gallery_modal.tpl.php';
	}
}

/**
 *      Show pages based on loaded pages array
 *
 *      @param      integer				$moduleName			Module name
 *      @param      array				$object			Object in current page
 *      @param      integer				$permission		Permission to access to current page
 *      @return     string				Pages html content
 *
 */
function saturne_check_access($permission, $object = null) {

	global $conf, $langs, $user, $moduleNameLowerCase;

	if (!isModEnabled($moduleNameLowerCase) || !isModEnabled('saturne')) {
		if (!isModEnabled($moduleNameLowerCase)){
			setEventMessage($langs->transnoentitiesnoconv('Enable' . ucfirst($moduleNameLowerCase)), 'warnings');
		}
		if (!isModEnabled('saturne')) {
			setEventMessage($langs->trans('EnableSaturne'), 'warnings');
		}
		$urltogo = dol_buildpath('/admin/modules.php?search_nature=external_Evarisk', 1);
		header("Location: " . $urltogo);
		exit;
	}

	if (!$permission){
		accessforbidden();
	}

	if ($user->socid > 0){
		accessforbidden();
	}

	if ($conf->multicompany->enabled) {
		if ($object->id > 0) {
			if ($object->entity != $conf->entity) {
				setEventMessage($langs->trans('ChangeEntityRedirection'), 'warnings');
				$urltogo = dol_buildpath('/custom/' . $moduleNameLowerCase . '/' . $moduleNameLowerCase . 'index.php?mainmenu=' . $moduleNameLowerCase, 1);
				header("Location: " . $urltogo);
				exit;
			}
		}
	}
}

/**
 * Print dol_get_fiche_head with Saturne custom enhancements
 *
 * @param CommonObject $object    Current object
 * @param string       $tabactive Tab active in navbar
 * @param string       $title     Title navbar
 */
function saturne_get_fiche_head(CommonObject $object = null, string $tabactive = '', string $title = '')
{
    // Configuration header
	if(is_object($object)) {
		if (array_key_exists('element', $object->fields)) {
			$prepareHead = $object->element . '_prepare_head';
			$head = $prepareHead($object);
		}
		if (array_key_exists('picto', $object->fields)) {
			$picto = $object->picto;
		}
		print dol_get_fiche_head($head, $tabactive, $title, -1, $picto);
	}
}

/**
 * Print dol_banner_tab with Saturne custom enhancements
 *
 * @param CommonObject $object   Current object
 * @param int          $shownav  Show Condition (navigation is shown if value is 1)
 * @param string       $fieldid  Field name for select next et previous (we make the select max and min on this field). Use 'none' for no prev/next search.
 * @param string       $fieldref Field name objet ref (object->ref) for select next and previous
 */
function saturne_banner_tab(CommonObject $object, string $paramid = 'ref', int $shownav = 1, string $fieldid = 'ref', string $fieldref = 'ref', string $morehtmlref = '')
{
    global $db, $langs, $hookmanager, $moduleName, $moduleNameLowerCase;

    if (isModEnabled('project')) {
        require_once DOL_DOCUMENT_ROOT . '/projet/class/project.class.php';
    }

    $linkback = '<a href="' . dol_buildpath('/' . $moduleNameLowerCase . '/view/' .  $object->element . '/' . $object->element . '_list.php', 1) . '?restore_lastsearch_values=1&object_type=' . $object->element . '">' . $langs->trans('BackToList') . '</a>';

	$saturneMorehtmlref = '';
	if (array_key_exists('label', $object->fields)) {
		$saturneMorehtmlref .= ' - ' . $object->label . '<br>';
	}

    $saturneMorehtmlref .= '<div class="refidno">';

	$saturneMorehtmlref .= $morehtmlref;
    // Thirdparty
    if (isModEnabled('societe') && array_key_exists('fk_soc', $object->fields)) {
        if (!empty($object->fk_soc)) {
            $object->fetch_thirdparty();
            $saturneMorehtmlref .= $langs->trans('ThirdParty') . ' : ' . (is_object($object->thirdparty) ? $object->thirdparty->getNomUrl(1) : '') . '<br>';
        } else {
            $saturneMorehtmlref .= $langs->trans('ThirdParty') . ' : ' . '<br>';
        }
    }

    // Project
    if (isModEnabled('project') && array_key_exists('fk_project', $object->fields)) {
        if (!empty($object->fk_project)) {
            $project = new Project($db);
            $project->fetch($object->fk_project);
            $saturneMorehtmlref .= $langs->trans('Project') . ' : ' . $project->getNomUrl(1, '', 1) . '<br>';
        } else {
            $saturneMorehtmlref .= $langs->trans('Project') . ' : ' . '<br>';
        }
    }

    $parameters = [];
    $reshook = $hookmanager->executeHooks('saturneBannerTab', $parameters, $object); // Note that $action and $object may have been modified by some hooks
    if ($reshook < 0) {
        setEventMessages($hookmanager->error, $hookmanager->errors, 'errors');
    } else {
        $saturneMorehtmlref .= $hookmanager->resPrint;
    }
    $saturneMorehtmlref .= '</div>';

    $moreparam = '&module_name=' . $moduleName . '&object_type=' . $object->element;

    dol_banner_tab($object, $paramid, $linkback, $shownav, $fieldid, $fieldref, $saturneMorehtmlref, $moreparam);

    print '<div class="underbanner clearboth"></div>';
}

/**
 *  Load translation files.
 *
 *  @param	array	$domains      		Array of lang files to load
 *	@return	int							<0 if KO, 0 if already loaded or loading not required, >0 if OK
 */
function saturne_load_langs(array $domains = [])
{
	global $langs, $moduleNameLowerCase;

	$langs->loadLangs(['saturne@saturne', 'other@saturne', $moduleNameLowerCase . '@' . $moduleNameLowerCase]);

	if (!empty($domains)) {
		foreach ($domains as $domain) {
			$langs->load($domain);
		}
	}
}
