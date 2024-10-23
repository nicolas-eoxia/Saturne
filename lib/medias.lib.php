<?php
/* Copyright (C) 2022-2023 EVARISK <technique@evarisk.com>
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

/**
 * \file    lib/medias.lib.php
 * \ingroup saturne
 * \brief   Library files with common functions for Saturne Medias
 */

include_once DOL_DOCUMENT_ROOT . '/core/lib/files.lib.php';
include_once DOL_DOCUMENT_ROOT . '/core/lib/images.lib.php';
require_once DOL_DOCUMENT_ROOT . '/core/lib/date.lib.php';

/**
 * Print medias from media gallery
 *
 * @param string $moduleName Module name
 * @param string $modulepart Submodule name
 * @param string $sdir       Directory path
 * @param string $size       Media size
 * @param int    $maxHeight  Media max height
 * @param int    $maxWidth   Media max width
 * @param int    $offset     Media gallery offset page
 */
function saturne_show_medias(string $moduleName, string $modulepart = 'ecm', string $sdir = '',string $size = '', int $maxHeight = 80, int $maxWidth = 80, int $offset = 1)
{
	global $conf, $langs, $user, $moduleNameLowerCase;

	$sortfield = 'date';
	$sortorder = 'desc';
	$dir       = $sdir . '/';

	$nbphoto = 0;

	$filearray = dol_dir_list($dir, 'files', 0, '', '(\.meta|_preview.*\.png)$', $sortfield, (strtolower($sortorder) == 'desc' ? SORT_DESC : SORT_ASC));

    if ($user->conf->SATURNE_MEDIA_GALLERY_SHOW_TODAY_MEDIAS == 1) {
        $yesterdayTimeStamp = dol_time_plus_duree(dol_now(), -1, 'd');
        $filearray = array_filter($filearray, function($file) use ($yesterdayTimeStamp) {
            return $file['date'] > $yesterdayTimeStamp;
        });
    }
    if ($user->conf->SATURNE_MEDIA_GALLERY_SHOW_UNLINKED_MEDIAS == 1) {
        $moduleObjectMedias = dol_dir_list($conf->$moduleNameLowerCase->multidir_output[$conf->entity ?? 1], 'files', 1, '', '.odt|.pdf|barcode|_mini|_medium|_small|_large');
        $filearray          = array_filter($filearray, function($file) use ($conf, $moduleNameLowerCase, $moduleObjectMedias) {
            $fileExists = array_search($file['name'], array_column($moduleObjectMedias, 'name'));
            return !$fileExists;
        });
    }

	$j         = 0;

	if (count($filearray)) {
		print '<div class="wpeo-gridlayout grid-5 grid-gap-3 grid-margin-2 ecm-photo-list ecm-photo-list">';

		if ($sortfield && $sortorder) {
			$filearray = dol_sort_array($filearray, $sortfield, $sortorder);
		}

		$moduleImageNumberPerPageConf = strtoupper($moduleName) . '_DISPLAY_NUMBER_MEDIA_GALLERY';
		for ($i = (($offset - 1) * $conf->global->$moduleImageNumberPerPageConf); $i < ($conf->global->$moduleImageNumberPerPageConf + (($offset - 1) * $conf->global->$moduleImageNumberPerPageConf));  $i++) {

            $fileName = $filearray[$i]['name'];
            if (image_format_supported($fileName) >= 0) {
                $nbphoto++;

                if ($size == 'mini' || $size == 'small') {   // Format vignette
                    $relativepath = $moduleName . '/medias/thumbs';
                    $modulepart   = 'ecm';
                    $path         = DOL_URL_ROOT . '/document.php?modulepart=' . $modulepart . '&attachment=0&file=' . str_replace('/', '%2F', $relativepath);

                    $file_infos = pathinfo($fileName);

                    // svg files aren't handled by vignette functions in images.lib, so they don't have thumbs
                    if ($file_infos['extension'] == 'svg') {
                        $path = preg_replace('/\/thumbs/', '', $path);
                        $shownFileName = $file_infos['filename'] . '.' . $file_infos['extension'];
                    } else {
                        $shownFileName = $file_infos['filename'] . '_' . $size . '.' . $file_infos['extension'];
                    }

                    ?>

                    <div class="center clickable-photo clickable-photo<?php echo $j; ?>" value="<?php echo $j; ?>">
                        <figure class="photo-image">
                            <?php
                            if (file_exists($filearray[$i]['path'] . '/thumbs/' . $shownFileName)) {
                                $advancedPreviewUrl = getAdvancedPreviewUrl($modulepart, $moduleName . '/medias/' . urlencode($fileName), 0, 'entity=' . $conf->entity);
                                $fullpath           = $path . '/' . urlencode($shownFileName) . '&entity=' . $conf->entity;
                                print '<input class="filename" type="hidden" value="' . $fileName . '">';
                                print '<a class="clicked-photo-preview" href="' . $advancedPreviewUrl . '"><i class="fas fa-2x fa-search-plus"></i></a>';
                                print '<img class="photo photo' . $j . '" width="' . $maxWidth . '" height="' . $maxHeight . '" src="' . $fullpath . '">';
                            } else {
                                print '<input type="hidden" class="fullname" data-fullname="' . $filearray[$i]['fullname'] . '">';
                                print '<i class="clicked-photo-preview regenerate-thumbs fas fa-redo"></i>';
                                print '<img class="photo photo' . $j . '" width="' . $maxWidth . '" height="' . $maxHeight . '" src="' . DOL_URL_ROOT . '/public/theme/common/nophoto.png">';
                            } ?>
                        </figure>
                        <?php print saturne_get_media_linked_elements($moduleName, $fileName); ?>
                        <div class="title"><?php echo $fileName; ?></div>
                    </div><?php
                    $j++;
                }
            }
		}
		print '</div>';
	} else {
		print '<br>';
		print '<div class="ecm-photo-list ecm-photo-list">';
		print $langs->trans('EmptyMediaGallery');
		print '</div>';
	}
}

/**
 * Show medias linked to an object
 *
 * @param  string      $modulepart         Submodule name
 * @param  string      $sdir               Directory path
 * @param  int|string  $size               Medias size
 * @param  int|string  $nbmax              Max number of medias shown per page
 * @param  int         $nbbyrow            Number of images per row
 * @param  int         $showfilename       Show filename under image
 * @param  int         $showaction         Show icon with action links
 * @param  int         $maxHeight          Media max height
 * @param  int         $maxWidth           Media max width
 * @param  int         $nolink 	           Do not add href link to image
 * @param  int         $notitle            Do not add title tag on image
 * @param  int         $usesharelink       Use the public shared link of image (if not available, the 'nophoto' image will be shown instead)
 * @param  string      $subdir             Subdir for file
 * @param  object|null $object             Object linked to show medias of
 * @param  string      $favoriteField      Name of favorite sql field of object
 * @param  int         $showFavoriteButton Show or hide favorite button
 * @param  int         $show_unlink_button Show or hide unlink button
 * @param  int         $useMiniFormat      Use media mini format instead of small
 * @param  int         $showOnlyFavorite   Show only object favorite media
 * @param  string      $morecss            Add more CSS on link
 * @param  int         $showdiv            Add div with "media-container" class
 * @return string      $return             Show medias linked
 */
function saturne_show_medias_linked(string $modulepart = 'ecm', string $sdir, $size = 0, $nbmax = 0, int $nbbyrow = 5, int $showfilename = 0, int $showaction = 0, int $maxHeight = 120, int $maxWidth = 160, int $nolink = 0, int $notitle = 0, int $usesharelink = 0, string $subdir = '', object $object = null, string $favoriteField = 'photo', int $showFavoriteButton = 1, int $show_unlink_button = 1 , int $useMiniFormat = 0, int $showOnlyFavorite = 0, string $morecss = '', int $showdiv = 1): string
{
    global $conf, $langs;

    // @todo en faire des paramètres de fonction
    $sortField = 'date';
    $sortOrder = 'desc';

    $dir  = $sdir . (substr($sdir, -1) == '/' ? '' : '/');
    $pDir = $subdir . (substr($subdir, -1) == '/' ? '' : '/');

    $dirThumb  = $dir . 'thumbs/';
    $pDirThumb = $pDir . 'thumbs/';

    $out     = '<!-- Photo -->';
    $nbPhoto = 0;
    $i       = 0;

    $fileArray = dol_dir_list($dir, 'files', 0, '', '(\.meta|_preview.*\.png)$', $sortField, (dol_strtolower($sortOrder) == 'desc' ? SORT_DESC : SORT_ASC), 1);
    if (!empty($fileArray)) {
        $favoriteExists = false;
        if ($object && property_exists($object, $favoriteField)) {
            $fileNames      = array_column($fileArray, 'name');
            $favoriteExists = in_array($object->$favoriteField, $fileNames, true);
        }
        foreach ($fileArray as $file) {
            $fileName = $file['name'];
            if (($showOnlyFavorite && ($object->$favoriteField == $fileName || !$favoriteExists)) || !$showOnlyFavorite) {
                if ($showdiv) {
                    $out .= '<div class="media-container">';
                }

                $out .= '<input type="hidden" class="file-path" value="' . $file['path'] . '">';
                $out .= '<input type="hidden" class="file-name" value="' . $fileName . '">';
                if (image_format_supported($fileName) >= 0) {
                    $nbPhoto++;
                    if ($size == 'small') {
                        if ($nbbyrow > 0) {
                            if ($nbPhoto == 1) {
                                $out .= '<table class="valigntop center centpercent" style="border: 0; padding: 2px; border-spacing: 2px; border-collapse: separate;">';
                            }

                            if ($nbPhoto % $nbbyrow == 1) {
                                $out .= '<tr class="center valignmiddle" style="border: 1px">';
                            }
                            $out .= '<td style="width: ' . ceil(100 / $nbbyrow) . '%" class="photo">';
                        } elseif ($nbbyrow < 0) {
                            $out .= '<div class="inline-block">';
                        }

                        if (empty($nolink)) {
                            $urlAdvanced = getAdvancedPreviewUrl($modulepart, $pDir . $fileName, 1, 'entity=' . $conf->entity);
                            if ($urlAdvanced) {
                                $out .= '<a class="clicked-photo-preview ' . $urlAdvanced['css'] . '" href="' . $urlAdvanced['url'] . '" target="' . $urlAdvanced['target'] . '" mime="' . $urlAdvanced['mime'] . '">';
                            } else {
                                $out .= '<a class="aphoto" href="' . DOL_URL_ROOT . '/viewimage.php?modulepart=' . $modulepart . '&entity=' . $conf->entity . '&file=' . urlencode($pDir . $fileName) . '" target="_blank">';
                            }
                        }

                        $imgArray = dol_getImageSize($dir . $fileName);
                        $alt      = $langs->transnoentitiesnoconv('File') . ': ' . $dir . $fileName;
                        $alt     .= ' - ' . $langs->transnoentitiesnoconv('Size') . ': ' . $imgArray['width'] . 'x' . $imgArray['height'];
                        if ($usesharelink) {
                            if (empty($maxHeight) || $photoVignette && $imgArray['height'] > $maxHeight) {
                                $out .= '<!-- Show thumb file -->';
                                $out .= '<img width="' . $maxWidth . '" height="' . $maxHeight . '" class="photo '. $morecss .' photowithmargin" height="' . $maxHeight . '" src="' . DOL_URL_ROOT . '/custom/saturne/utils/viewimage.php?modulepart=' . $modulepart . '&entity=' . $object->entity . '&file=' . urlencode($pDirThumb . $photoVignette) . '" title="' . dol_escape_htmltag($alt) . '" data-object-id="' . $object->id . '">';
                            } else {
                                $out .= '<!-- Show original file -->';
                                $out .= '<img width="' . $maxWidth . '" height="' . $maxHeight . '" class="photo '. $morecss .' photowithmargin" src="' . DOL_URL_ROOT . '/custom/saturne/utils/viewimage.php?modulepart=' . $modulepart . '&entity=' . $object->entity . '&file=' . urlencode($pDir . $fileName) . '" title="' . dol_escape_htmltag($alt) . '" data-object-id="' . $object->id . '">';
                            }
                        } else {
                            if (empty($maxHeight) || $photoVignette && $imgArray['height'] > $maxHeight) {
                                $out .= '<!-- Show thumb file -->';
                                $out .= '<img width="' . $maxWidth . '" height="' . $maxHeight . '" class="photo '. $morecss .'"  src="' . DOL_URL_ROOT . '/viewimage.php?modulepart=' . $modulepart . '&entity=' . $conf->entity . '&file=' . urlencode($pDirThumb . $photoVignette) . '" title="' . dol_escape_htmltag($alt) . '" data-object-id="' . $object->id . '">';
                            } else {
                                $out .= '<!-- Show original file -->';
                                $out .= '<img width="' . $maxWidth . '" height="' . $maxHeight . '" class="photo '. $morecss .' photowithmargin" height="' . $maxHeight . '" src="' . DOL_URL_ROOT . '/viewimage.php?modulepart=' . $modulepart . '&entity=' . $conf->entity . '&file=' . urlencode($pDir . $fileName) . '" title="' . dol_escape_htmltag($alt) . '" data-object-id="' . $object->id . '">';
                            }
                        }

                        if (empty($nolink)) {
                            $out .= '</a>';
                        }
                        if ($nbbyrow > 0) {
                            $out .= '</td>';
                            if (($nbPhoto % $nbbyrow) == 0) {
                                $out .= '</tr>';
                            }
                        } elseif ($nbbyrow < 0) {
                            $out .= '</td>';
                        }
                    }

                    switch ($size) {
                        case 'mini' :
                        case 'small' :
                        case 'medium' :
                        case 'large' :
                            $photoVignette = basename(getImageFileNameForSize($dir . $fileName, '_' . $size));
                            $widthName     = 'SATURNE_MEDIA_MAX_WIDTH_' . dol_strtoupper($size);
                            $heightName    = 'SATURNE_MEDIA_MAX_HEIGHT_' . dol_strtoupper($size);
                            if (!dol_is_file($dirThumb . $photoVignette)) {
                                $photoVignette = '';
                            }

                            $out .= '<img width="' . $conf->global->$widthName . '" height="' . $conf->global->$heightName . '" class="photo photowithmargin" src="' . DOL_URL_ROOT . '/viewimage.php?modulepart=' . $modulepart . '&entity=' . $conf->entity . '&file=' . urlencode($pDirThumb . $photoVignette) . '" title="' . dol_escape_htmltag($alt) . '" data-object-id="' . $object->id . '">';
                            break;
                        default :
                            //$out .= '<img class="photo photowithmargin" src="' . DOL_URL_ROOT . '/viewimage.php?modulepart=' . $modulepart . '&entity=' . $conf->entity . '&file=' . urlencode($pDir . $fileName) . '" title="' . dol_escape_htmltag($alt) . '"  data-object-id="' . $object->id . '">';
                            break;
                    }
                }

                if ($showFavoriteButton && $object && property_exists($object, $favoriteField)) {
                    $favorite = (!$favoriteExists && $i == 0) || ($object->$favoriteField == $fileName) ? 'favorite' : '';
                    $out .=
                        '<div class="wpeo-button button-square-50 button-blue ' . $object->element . ' media-gallery-favorite ' . $favorite . '" value="' . $object->id . '">
                            <input type="hidden" class="filename" value="' . $fileName . '">
                            <i class="' . ($favorite == 'favorite' ? 'fas' : 'far') . ' fa-star button-icon"></i>
                        </div>';
                }

                if ($show_unlink_button) {
                    $confirmationParams = [
                        'picto'             => 'fontawesome_fa-unlink_fas_#e05353',
                        'color'             => '#e05353',
                        'confirmationTitle' => 'ConfirmUnlinkMedia',
                        'buttonParams'      => ['No' => 'button-blue marginrightonly confirmation-close', 'Yes' => 'button-red confirmation-delete']
                    ];
                    require __DIR__ . '/../core/tpl/utils/confirmation_view.tpl.php';
                    $out .=
                        '<div class="wpeo-button button-square-50 button-grey ' . $object->element . ' media-gallery-unlink" value="' . $object->id . '">
							<input class="element-linked-id" type="hidden" value="' . ($object->id > 0 ? $object->id : 0) . '">
							<input class="filename" type="hidden" value="' . $photo . '">
							<i class="fas fa-unlink button-icon"></i>
						</div>';
                }
                if ($showdiv) {
                    $return .= "</div>\n";
                }

                if ($nbmax && $nbPhoto >= $nbmax) break;
                $i++;
            }
        }

        if ($size == 1 || $size == 'small') {
            if ($nbbyrow > 0) {
                while ($nbPhoto % $nbbyrow) {
                    $out .= '<td style="width: ' . ceil(100 / $nbbyrow) . '%">&nbsp;</td>';
                    $nbPhoto++;
                }

                if ($nbPhoto) {
                    $out .= '</table>';
                }
            }
        }
    } else {
        $out .= '<img width="' . $maxWidth . '" height="' . $maxHeight . '" class="photo ' . $morecss . ' photowithmargin" src="' . DOL_URL_ROOT . '/public/theme/common/nophoto.png" title="' . $langs->trans('NoPhotoYet') . '" data-object-id="' . $object->id . '">';
    }

    return $out;
}

/**
 * Return file specified thumb name
 *
 * @param  string $filename  File name
 * @param  string $thumbType Thumb type (small, mini, large, medium)
 * @return string            Thumb full name
 *
 */
function saturne_get_thumb_name(string $filename, string $thumbType = 'small'): string
{
	$imgName       = pathinfo($filename, PATHINFO_FILENAME);
	$imgExtension  = pathinfo($filename, PATHINFO_EXTENSION);
    return $imgName . '_' . $thumbType . '.' . $imgExtension;
}

/**
 * Return media linked elements count
 *
 * @param  string $moduleName Module name
 * @param  string $fileName       File name
 * @return string $output     Show media linked element count
 *
 */
function saturne_get_media_linked_elements(string $moduleName, string $fileName): string
{
    global $conf, $db, $langs;

    $moduleNameLowerCase    = dol_strtolower($moduleName);
    $regexFormattedFileName = '^' . preg_quote($fileName, '/');

    $dir                 = $conf->$moduleNameLowerCase->multidir_output[$conf->entity ?? 1];
    $fileArrays          = dol_dir_list($dir, 'files', 1, $regexFormattedFileName, '.odt|.pdf|barcode|_mini|_medium|_small|_large');
    $moduleClasses       = dol_dir_list(__DIR__ . '/../../' . $moduleNameLowerCase . '/class/', 'files', 1);

    $mediaLinkedElements = [];
    foreach ($fileArrays as $fileArray) {
        $element   = preg_split('/\//', $fileArray['relativename']);
        $classKey  = array_search($element[0] . '.class.php', array_column($moduleClasses, 'name'));
        $classPath = $moduleClasses[$classKey]['fullname'];

        require_once $classPath;

        $className = ucfirst($element[0]);
        $object    = new $className($db);

        $mediaLinkedElements[$fileArray['name']][$element[0]]['picto'] = $object->picto;
        $mediaLinkedElements[$fileArray['name']][$element[0]]['value']++;
    }

    $output = '<div class="linked-element">';
    foreach ($mediaLinkedElements as $mediaLinkedElement) {
        foreach ($mediaLinkedElement as $key => $linkedElement) {
            $output .= '<span class="paddingleft paddingright">' . img_picto($langs->trans(ucfirst($key)), $linkedElement['picto'], 'class="paddingright"');
            $output .= $linkedElement['value'];
            $output .= '</span>';
        }
    }
    $output .= '</div>';

    return $output;
}
