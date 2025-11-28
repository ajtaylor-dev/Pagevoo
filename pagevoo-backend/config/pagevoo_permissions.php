<?php

/**
 * Pagevoo Feature Permissions by Account Tier
 *
 * This config file defines which features are available to each account tier.
 * Based on: Website_Builder_Feature_Matrix.csv
 *
 * Account Tiers: trial, brochure, niche, pro
 */

return [
    'trial' => [
        // Content Editing - All enabled
        'wysiwyg_text_editor' => true,
        'inline_text_editing' => true,
        'image_upload' => true,
        'image_management' => true,
        'image_search_filter' => true,
        'image_resize' => true,
        'image_alignment' => true,
        'image_alt_text' => true,
        'image_links' => true,
        'copy_paste_images' => true,
        'headings' => true,
        'lists' => true,
        'hyperlinks' => true,
        'clear_formatting' => true,

        // Section Management - All enabled
        'add_sections' => true,
        'delete_sections' => true,
        'reorder_sections' => true,
        'duplicate_sections' => true,
        'lock_unlock_sections' => true,
        'section_name_id' => true,

        // Grid Sections - All enabled
        'add_columns' => true,
        'delete_columns' => true,
        'column_styling' => true,
        'remove_all_borders' => true,
        'grid_1_column' => true,
        'grid_2_column' => true,
        'grid_3_column' => true,
        'grid_4_column' => true,
        'grid_2x2' => true,
        'grid_3x2' => true,

        // Navigation - All enabled
        'navbar_section' => true,
        'navigation_links' => true,
        'dropdown_menus' => true,
        'navigation_tree_manager' => true,
        'link_to_pages' => true,
        'external_urls' => true,
        'mobile_menu' => true,
        'navbar_background' => true,
        'navbar_padding_margin' => true,
        'navbar_width_height' => true,
        'logo_position' => true,
        'links_position' => true,
        'link_colors' => true,
        'dropdown_trigger' => true,
        'hover_delay' => true,

        // Footer - All enabled
        'footer_section' => true,
        'footer_simple' => true,
        'footer_columns' => true,
        'footer_background' => true,
        'footer_padding' => true,
        'footer_text_align' => true,
        'copyright_section' => true,

        // Page Management - All enabled
        'add_new_page' => true,
        'delete_page' => true,
        'rename_page' => true,
        'reorder_pages' => true,
        'set_homepage' => true,
        'sitemap_view' => true,
        'page_css' => true,

        // Styling - Site Level - All enabled
        'site_css_editor' => true,
        'font_family' => true,
        'text_color' => true,
        'font_size' => true,
        'body_padding' => true,
        'body_margin' => true,
        'background_color' => true,
        'header_settings' => true,
        'paragraph_styling' => true,
        'hyperlink_styling' => true,

        // Styling - Page Level - All enabled
        'page_css_editor' => true,
        'page_background_color' => true,
        'page_body_padding' => true,
        'page_body_margin' => true,

        // Styling - Section/Row/Column Level - All enabled
        'section_css_editor' => true,
        'section_background_color' => true,
        'section_background_image' => true,
        'section_background_properties' => true,
        'section_padding' => true,
        'section_margin' => true,
        'section_width' => true,
        'section_height' => true,
        'section_min_width' => true,
        'section_min_height' => true,
        'section_border_width' => true,
        'section_border_style' => true,
        'section_border_color' => true,
        'section_border_radius' => true,
        'section_display_property' => true,
        'section_overflow' => true,
        'section_float' => true,
        'section_text_decoration' => true,
        'section_opacity' => true,
        'section_box_shadow' => true,
        'row_css_editor' => true,
        'column_css_editor' => true,

        // Advanced Features - Limited
        'code_view_toggle' => false, // NO
        'custom_css_code_tab' => false, // NO
        'undo' => true,
        'redo' => true,
        'keyboard_shortcuts' => true,
        'save_website' => true,
        'live_preview' => true,
        'publish_website' => false, // NO
        'unpublish_website' => false, // NO
        'export_section' => false, // NO
        'import_section' => false, // NO
        'export_page' => false, // NO
        'import_page' => false, // NO
        'section_library_access' => false, // NO
        'page_library_access' => false, // NO
        'css_inheritance_display' => true,
        'viewport_switcher' => true,
        'zoom_controls' => true,
        'show_hide_ui' => true,
        'responsive_design' => true,

        // Collaboration - None
        'collaborator_management' => false,
        'groups' => false,
        'permissions' => false,
        'share_sections' => false,
        'share_pages' => false,

        // Journal - None
        'notes_system' => false,
        'share_notes' => false,

        // Limitations
        'max_pages' => 4,
        'max_sections_per_page' => 10,
        'max_images' => 10,
        'max_storage_mb' => 250,
        'custom_domain' => false,
        'remove_branding' => false,

        // Support
        'documentation_access' => true,
        'video_tutorials' => true,
        'email_support' => false,
        'priority_support' => false,

        // Template Manager
        'access_trial_templates' => true,
        'access_brochure_templates' => true,
        'access_niche_templates' => false,
        'access_pro_templates' => false,
        'trial_feature_indicator' => true,

        // Script Features
        'script_contact_form' => true,
        'script_image_gallery' => true,
        'script_blog' => false,
        'script_events' => false,
        'script_user_access_system' => false,
        'script_booking' => false,
        'script_voopress' => false,
        'script_shop' => false,
        'script_file_hoster' => false,
        'script_video_sharing' => false,
        'script_social_platform' => false,
        'script_courses' => false,
    ],

    'brochure' => [
        // Content Editing - All enabled
        'wysiwyg_text_editor' => true,
        'inline_text_editing' => true,
        'image_upload' => true,
        'image_management' => true,
        'image_search_filter' => true,
        'image_resize' => true,
        'image_alignment' => true,
        'image_alt_text' => true,
        'image_links' => true,
        'copy_paste_images' => true,
        'headings' => true,
        'lists' => true,
        'hyperlinks' => true,
        'clear_formatting' => true,

        // Section Management - All enabled
        'add_sections' => true,
        'delete_sections' => true,
        'reorder_sections' => true,
        'duplicate_sections' => true,
        'lock_unlock_sections' => true,
        'section_name_id' => true,

        // Grid Sections - All enabled
        'add_columns' => true,
        'delete_columns' => true,
        'column_styling' => true,
        'remove_all_borders' => true,
        'grid_1_column' => true,
        'grid_2_column' => true,
        'grid_3_column' => true,
        'grid_4_column' => true,
        'grid_2x2' => true,
        'grid_3x2' => true,

        // Navigation - All enabled
        'navbar_section' => true,
        'navigation_links' => true,
        'dropdown_menus' => true,
        'navigation_tree_manager' => true,
        'link_to_pages' => true,
        'external_urls' => true,
        'mobile_menu' => true,
        'navbar_background' => true,
        'navbar_padding_margin' => true,
        'navbar_width_height' => true,
        'logo_position' => true,
        'links_position' => true,
        'link_colors' => true,
        'dropdown_trigger' => true,
        'hover_delay' => true,

        // Footer - All enabled
        'footer_section' => true,
        'footer_simple' => true,
        'footer_columns' => true,
        'footer_background' => true,
        'footer_padding' => true,
        'footer_text_align' => true,
        'copyright_section' => true,

        // Page Management - All enabled
        'add_new_page' => true,
        'delete_page' => true,
        'rename_page' => true,
        'reorder_pages' => true,
        'set_homepage' => true,
        'sitemap_view' => true,
        'page_css' => true,

        // Styling - Site Level - All enabled
        'site_css_editor' => true,
        'font_family' => true,
        'text_color' => true,
        'font_size' => true,
        'body_padding' => true,
        'body_margin' => true,
        'background_color' => true,
        'header_settings' => true,
        'paragraph_styling' => true,
        'hyperlink_styling' => true,

        // Styling - Page Level - All enabled
        'page_css_editor' => true,
        'page_background_color' => true,
        'page_body_padding' => true,
        'page_body_margin' => true,

        // Styling - Section/Row/Column Level - All enabled
        'section_css_editor' => true,
        'section_background_color' => true,
        'section_background_image' => true,
        'section_background_properties' => true,
        'section_padding' => true,
        'section_margin' => true,
        'section_width' => true,
        'section_height' => true,
        'section_min_width' => true,
        'section_min_height' => true,
        'section_border_width' => true,
        'section_border_style' => true,
        'section_border_color' => true,
        'section_border_radius' => true,
        'section_display_property' => true,
        'section_overflow' => true,
        'section_float' => true,
        'section_text_decoration' => true,
        'section_opacity' => true,
        'section_box_shadow' => true,
        'row_css_editor' => true,
        'column_css_editor' => true,

        // Advanced Features - Expanded
        'code_view_toggle' => true,
        'custom_css_code_tab' => true,
        'undo' => true,
        'redo' => true,
        'keyboard_shortcuts' => true,
        'save_website' => true,
        'live_preview' => true,
        'publish_website' => true, // NOW ENABLED
        'unpublish_website' => true, // NOW ENABLED
        'export_section' => true, // NOW ENABLED
        'import_section' => true, // NOW ENABLED
        'export_page' => true, // NOW ENABLED
        'import_page' => true, // NOW ENABLED
        'section_library_access' => true, // NOW ENABLED
        'page_library_access' => true, // NOW ENABLED
        'css_inheritance_display' => true,
        'viewport_switcher' => true,
        'zoom_controls' => true,
        'show_hide_ui' => true,
        'responsive_design' => true,

        // Collaboration - None
        'collaborator_management' => false,
        'groups' => false,
        'permissions' => false,
        'share_sections' => false,
        'share_pages' => false,

        // Journal - None
        'notes_system' => false,
        'share_notes' => false,

        // Limitations - Increased
        'max_pages' => 20,
        'max_sections_per_page' => 40,
        'max_images' => 250,
        'max_storage_mb' => 2000,
        'custom_domain' => true,
        'remove_branding' => true,

        // Support - Expanded
        'documentation_access' => true,
        'video_tutorials' => true,
        'email_support' => true, // NOW ENABLED
        'priority_support' => false,

        // Template Manager
        'access_trial_templates' => true,
        'access_brochure_templates' => true,
        'access_niche_templates' => false,
        'access_pro_templates' => false,
        'trial_feature_indicator' => true,

        // Script Features - Expanded
        'script_contact_form' => true,
        'script_image_gallery' => true,
        'script_blog' => true, // NOW ENABLED
        'script_events' => true, // NOW ENABLED
        'script_user_access_system' => false,
        'script_booking' => false,
        'script_voopress' => false,
        'script_shop' => false,
        'script_file_hoster' => false,
        'script_video_sharing' => false,
        'script_social_platform' => false,
        'script_courses' => false,
    ],

    'niche' => [
        // All features from brochure PLUS:

        // Content Editing - All enabled
        'wysiwyg_text_editor' => true,
        'inline_text_editing' => true,
        'image_upload' => true,
        'image_management' => true,
        'image_search_filter' => true,
        'image_resize' => true,
        'image_alignment' => true,
        'image_alt_text' => true,
        'image_links' => true,
        'copy_paste_images' => true,
        'headings' => true,
        'lists' => true,
        'hyperlinks' => true,
        'clear_formatting' => true,

        // Section Management - All enabled
        'add_sections' => true,
        'delete_sections' => true,
        'reorder_sections' => true,
        'duplicate_sections' => true,
        'lock_unlock_sections' => true,
        'section_name_id' => true,

        // Grid Sections - All enabled
        'add_columns' => true,
        'delete_columns' => true,
        'column_styling' => true,
        'remove_all_borders' => true,
        'grid_1_column' => true,
        'grid_2_column' => true,
        'grid_3_column' => true,
        'grid_4_column' => true,
        'grid_2x2' => true,
        'grid_3x2' => true,

        // Navigation - All enabled
        'navbar_section' => true,
        'navigation_links' => true,
        'dropdown_menus' => true,
        'navigation_tree_manager' => true,
        'link_to_pages' => true,
        'external_urls' => true,
        'mobile_menu' => true,
        'navbar_background' => true,
        'navbar_padding_margin' => true,
        'navbar_width_height' => true,
        'logo_position' => true,
        'links_position' => true,
        'link_colors' => true,
        'dropdown_trigger' => true,
        'hover_delay' => true,

        // Footer - All enabled
        'footer_section' => true,
        'footer_simple' => true,
        'footer_columns' => true,
        'footer_background' => true,
        'footer_padding' => true,
        'footer_text_align' => true,
        'copyright_section' => true,

        // Page Management - All enabled
        'add_new_page' => true,
        'delete_page' => true,
        'rename_page' => true,
        'reorder_pages' => true,
        'set_homepage' => true,
        'sitemap_view' => true,
        'page_css' => true,

        // Styling - Site Level - All enabled
        'site_css_editor' => true,
        'font_family' => true,
        'text_color' => true,
        'font_size' => true,
        'body_padding' => true,
        'body_margin' => true,
        'background_color' => true,
        'header_settings' => true,
        'paragraph_styling' => true,
        'hyperlink_styling' => true,

        // Styling - Page Level - All enabled
        'page_css_editor' => true,
        'page_background_color' => true,
        'page_body_padding' => true,
        'page_body_margin' => true,

        // Styling - Section/Row/Column Level - All enabled
        'section_css_editor' => true,
        'section_background_color' => true,
        'section_background_image' => true,
        'section_background_properties' => true,
        'section_padding' => true,
        'section_margin' => true,
        'section_width' => true,
        'section_height' => true,
        'section_min_width' => true,
        'section_min_height' => true,
        'section_border_width' => true,
        'section_border_style' => true,
        'section_border_color' => true,
        'section_border_radius' => true,
        'section_display_property' => true,
        'section_overflow' => true,
        'section_float' => true,
        'section_text_decoration' => true,
        'section_opacity' => true,
        'section_box_shadow' => true,
        'row_css_editor' => true,
        'column_css_editor' => true,

        // Advanced Features - All enabled
        'code_view_toggle' => true,
        'custom_css_code_tab' => true,
        'undo' => true,
        'redo' => true,
        'keyboard_shortcuts' => true,
        'save_website' => true,
        'live_preview' => true,
        'publish_website' => true,
        'unpublish_website' => true,
        'export_section' => true,
        'import_section' => true,
        'export_page' => true,
        'import_page' => true,
        'section_library_access' => true,
        'page_library_access' => true,
        'css_inheritance_display' => true,
        'viewport_switcher' => true,
        'zoom_controls' => true,
        'show_hide_ui' => true,
        'responsive_design' => true,

        // Collaboration - None
        'collaborator_management' => false,
        'groups' => false,
        'permissions' => false,
        'share_sections' => false,
        'share_pages' => false,

        // Journal - NOW ENABLED
        'notes_system' => true,
        'share_notes' => false,

        // Limitations - Increased
        'max_pages' => 30,
        'max_sections_per_page' => 40,
        'max_images' => 500,
        'max_storage_mb' => 4000,
        'custom_domain' => true,
        'remove_branding' => true,

        // Support
        'documentation_access' => true,
        'video_tutorials' => true,
        'email_support' => true,
        'priority_support' => false,

        // Template Manager - Expanded
        'access_trial_templates' => true,
        'access_brochure_templates' => true,
        'access_niche_templates' => true, // NOW ENABLED
        'access_pro_templates' => false,
        'trial_feature_indicator' => true,

        // Script Features - Expanded
        'script_contact_form' => true,
        'script_image_gallery' => true,
        'script_blog' => true,
        'script_events' => true,
        'script_user_access_system' => true, // NOW ENABLED
        'script_booking' => true, // NOW ENABLED (requires UAS)
        'script_voopress' => true, // NOW ENABLED (requires UAS)
        'script_shop' => true, // NOW ENABLED (requires UAS)
        'script_file_hoster' => false,
        'script_video_sharing' => false,
        'script_social_platform' => false,
        'script_courses' => false,
    ],

    'pro' => [
        // ALL FEATURES ENABLED

        // Content Editing
        'wysiwyg_text_editor' => true,
        'inline_text_editing' => true,
        'image_upload' => true,
        'image_management' => true,
        'image_search_filter' => true,
        'image_resize' => true,
        'image_alignment' => true,
        'image_alt_text' => true,
        'image_links' => true,
        'copy_paste_images' => true,
        'headings' => true,
        'lists' => true,
        'hyperlinks' => true,
        'clear_formatting' => true,

        // Section Management
        'add_sections' => true,
        'delete_sections' => true,
        'reorder_sections' => true,
        'duplicate_sections' => true,
        'lock_unlock_sections' => true,
        'section_name_id' => true,

        // Grid Sections
        'add_columns' => true,
        'delete_columns' => true,
        'column_styling' => true,
        'remove_all_borders' => true,
        'grid_1_column' => true,
        'grid_2_column' => true,
        'grid_3_column' => true,
        'grid_4_column' => true,
        'grid_2x2' => true,
        'grid_3x2' => true,

        // Navigation
        'navbar_section' => true,
        'navigation_links' => true,
        'dropdown_menus' => true,
        'navigation_tree_manager' => true,
        'link_to_pages' => true,
        'external_urls' => true,
        'mobile_menu' => true,
        'navbar_background' => true,
        'navbar_padding_margin' => true,
        'navbar_width_height' => true,
        'logo_position' => true,
        'links_position' => true,
        'link_colors' => true,
        'dropdown_trigger' => true,
        'hover_delay' => true,

        // Footer
        'footer_section' => true,
        'footer_simple' => true,
        'footer_columns' => true,
        'footer_background' => true,
        'footer_padding' => true,
        'footer_text_align' => true,
        'copyright_section' => true,

        // Page Management
        'add_new_page' => true,
        'delete_page' => true,
        'rename_page' => true,
        'reorder_pages' => true,
        'set_homepage' => true,
        'sitemap_view' => true,
        'page_css' => true,

        // Styling - Site Level
        'site_css_editor' => true,
        'font_family' => true,
        'text_color' => true,
        'font_size' => true,
        'body_padding' => true,
        'body_margin' => true,
        'background_color' => true,
        'header_settings' => true,
        'paragraph_styling' => true,
        'hyperlink_styling' => true,

        // Styling - Page Level
        'page_css_editor' => true,
        'page_background_color' => true,
        'page_body_padding' => true,
        'page_body_margin' => true,

        // Styling - Section/Row/Column Level
        'section_css_editor' => true,
        'section_background_color' => true,
        'section_background_image' => true,
        'section_background_properties' => true,
        'section_padding' => true,
        'section_margin' => true,
        'section_width' => true,
        'section_height' => true,
        'section_min_width' => true,
        'section_min_height' => true,
        'section_border_width' => true,
        'section_border_style' => true,
        'section_border_color' => true,
        'section_border_radius' => true,
        'section_display_property' => true,
        'section_overflow' => true,
        'section_float' => true,
        'section_text_decoration' => true,
        'section_opacity' => true,
        'section_box_shadow' => true,
        'row_css_editor' => true,
        'column_css_editor' => true,

        // Advanced Features
        'code_view_toggle' => true,
        'custom_css_code_tab' => true,
        'undo' => true,
        'redo' => true,
        'keyboard_shortcuts' => true,
        'save_website' => true,
        'live_preview' => true,
        'publish_website' => true,
        'unpublish_website' => true,
        'export_section' => true,
        'import_section' => true,
        'export_page' => true,
        'import_page' => true,
        'section_library_access' => true,
        'page_library_access' => true,
        'css_inheritance_display' => true,
        'viewport_switcher' => true,
        'zoom_controls' => true,
        'show_hide_ui' => true,
        'responsive_design' => true,

        // Collaboration - ALL ENABLED
        'collaborator_management' => true,
        'groups' => true,
        'permissions' => true,
        'share_sections' => true,
        'share_pages' => true,

        // Journal - ALL ENABLED
        'notes_system' => true,
        'share_notes' => true,

        // Limitations - Maximum
        'max_pages' => null, // Unlimited
        'max_sections_per_page' => 40,
        'max_images' => 1000,
        'max_storage_mb' => 8000, // Increasable for fee
        'custom_domain' => true,
        'remove_branding' => true,

        // Support - ALL ENABLED
        'documentation_access' => true,
        'video_tutorials' => true,
        'email_support' => true,
        'priority_support' => true,

        // Template Manager - ALL ENABLED
        'access_trial_templates' => true,
        'access_brochure_templates' => true,
        'access_niche_templates' => true,
        'access_pro_templates' => true,
        'trial_feature_indicator' => true,

        // Script Features - ALL ENABLED
        'script_contact_form' => true,
        'script_image_gallery' => true,
        'script_blog' => true,
        'script_events' => true,
        'script_user_access_system' => true,
        'script_booking' => true,
        'script_voopress' => true,
        'script_shop' => true,
        'script_file_hoster' => true, // ONLY PRO (requires UAS)
        'script_video_sharing' => true, // ONLY PRO (requires UAS)
        'script_social_platform' => true, // ONLY PRO (requires UAS)
        'script_courses' => true, // ONLY PRO (requires UAS)
    ],
];
