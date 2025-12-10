// Default CSS functions
export const getDefaultColumnCSS = () => `border: 2px dashed #d1d5db;
border-radius: 0.5rem;
min-height: 200px;
padding: 1rem;`

export const getDefaultSectionCSS = () => `padding: 2rem;`

export const createDefaultContentCSS = (numColumns: number) => {
  const columns: { [key: string]: string } = {}
  for (let i = 0; i < numColumns; i++) {
    columns[i] = getDefaultColumnCSS()
  }
  return { columns }
}

// Core section templates
export const coreSections = [
  {
    type: 'grid-1x1',
    label: '1 Column',
    description: 'Single full-width column',
    cols: 1,
    rows: 1,
    colWidths: [12], // col-12 (100%)
    defaultContent: {
      columns: [{ content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>', colWidth: 12 }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-2x1',
    label: '2 Columns',
    description: 'Two equal columns (50/50)',
    cols: 2,
    rows: 1,
    colWidths: [6, 6], // 2x col-6 (50% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>', colWidth: 6 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>', colWidth: 6 }
      ],
      content_css: createDefaultContentCSS(2),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-3x1',
    label: '3 Columns',
    description: 'Three equal columns (33/33/33)',
    cols: 3,
    rows: 1,
    colWidths: [4, 4, 4], // 3x col-4 (33.33% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 4 },
        { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 4 }
      ],
      content_css: createDefaultContentCSS(3),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-4x1',
    label: '4 Columns',
    description: 'Four equal columns (25% each)',
    cols: 4,
    rows: 1,
    colWidths: [3, 3, 3, 3], // 4x col-3 (25% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 3 },
        { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 3 },
        { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 3 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 3 }
      ],
      content_css: createDefaultContentCSS(4),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-2x2',
    label: '2x2 Grid',
    description: 'Four boxes in 2x2 layout',
    cols: 2,
    rows: 2,
    colWidths: [6, 6, 6, 6], // 4x col-6 (2 rows of 50/50)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 6 },
        { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 6 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 6 },
        { content: '<p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.</p>', colWidth: 6 }
      ],
      content_css: createDefaultContentCSS(4),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-3x2',
    label: '3x2 Grid',
    description: 'Six boxes in 3x2 layout',
    cols: 3,
    rows: 2,
    colWidths: [4, 4, 4, 4, 4, 4], // 6x col-4 (2 rows of 33/33/33)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 4 },
        { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 4 },
        { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 4 },
        { content: '<p>Excepteur sint occaecat cupidatat non proident sunt.</p>', colWidth: 4 },
        { content: '<p>Culpa qui officia deserunt mollit anim id est laborum.</p>', colWidth: 4 }
      ],
      content_css: createDefaultContentCSS(6),
      section_css: getDefaultSectionCSS()
    }
  },
]

// Header/Navigation section templates
export const headerNavigationSections = [
  {
    type: 'navbar',
    label: 'Navigation Bar',
    description: 'Simple navigation with logo and links',
    position: 'top',
    defaultContent: {
      logo: 'Logo',
      logoWidth: 25,
      links: ['Home', 'About', 'Services', 'Contact'],
      position: 'static',
      content_css: '',
      containerStyle: {
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '0px',
        paddingRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        width: '100%',
        height: 'auto',
        background: '#ffffff'
      }
    }
  }
]

// Footer section templates
export const footerSections = [
  { type: 'footer-simple', label: 'Simple Footer', description: 'Basic footer with copyright text', position: 'bottom', defaultContent: { text: '© 2025 Company Name. All rights reserved.' } },
  {
    type: 'footer-columns',
    label: 'Column Footer',
    description: 'Multi-column footer with copyright',
    position: 'bottom',
    defaultContent: {
      columns: [
        { content: '<h3 style="text-align: center;">Company</h3><p style="text-align: center;">About Us</p><p style="text-align: center;">Contact</p>', colWidth: 4 },
        { content: '<h3 style="text-align: center;">Services</h3><p style="text-align: center;">Service 1</p><p style="text-align: center;">Service 2</p>', colWidth: 4 },
        { content: '<h3 style="text-align: center;">Connect</h3><p style="text-align: center;">Email</p><p style="text-align: center;">Phone</p>', colWidth: 4 }
      ],
      copyrightText: '© 2025 Company Name. All rights reserved.',
      content_css: createDefaultContentCSS(3),
      section_css: 'background-color: #172554; color: white; padding: 2rem;'
    }
  }
]

// Special Sections - Feature-specific components
export const specialSections = [
  // Form Wrap Container
  {
    type: 'form-wrap',
    label: 'Contact Form',
    description: 'Form container for contact form fields',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      formConfig: {
        name: 'Contact Form',
        title: 'Get in Touch',
        subtitle: 'Fill out the form below and we\'ll get back to you.',
        formType: 'contact',
        submitButtonText: 'Send Message',
        sendAutoResponder: false,
        recipientEmail: ''
      },
      formFields: [],
      formCSS: {
        container: {
          padding: '32px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }
      }
    }
  },
  // Gallery Wrap Container
  {
    type: 'gallery-wrap',
    label: 'Image Gallery',
    description: 'Display images from an album',
    category: 'image-gallery',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      galleryConfig: {
        name: 'Image Gallery',
        albumId: null,
        layout: 'grid',
        columns: 3,
        gap: '16px',
        enableLightbox: true,
        showCaptions: 'hover',
        hoverEffect: 'zoom',
        borderRadius: '8px',
        aspectRatio: 'square',
        autoPlay: false,
        autoPlayInterval: 5000,
        showDots: true,
        showArrows: true,
        containerStyle: {
          padding: '32px',
          background: 'transparent',
          borderRadius: '0'
        }
      },
      title: '',
      subtitle: ''
    }
  },
  // Blog Wrap Container
  {
    type: 'blog-wrap',
    label: 'Blog Posts',
    description: 'Display a list of blog posts',
    category: 'blog',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      blogConfig: {
        name: 'Blog Posts',
        layout: 'list', // list, grid, cards
        postsPerPage: 10,
        columns: 2, // For grid/cards layout
        gap: '24px',
        showFeaturedImage: true,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
        showTags: false,
        showReadMore: true,
        readMoreText: 'Read More',
        sortBy: 'newest', // newest, oldest, title_asc, title_desc
        filterCategory: null, // null = all categories
        excerptLength: 150, // characters
        dateFormat: 'MMM D, YYYY',
        containerStyle: {
          padding: '32px',
          background: 'transparent',
          borderRadius: '0'
        }
      },
      title: '',
      subtitle: ''
    }
  },
  // Events Wrap Container
  {
    type: 'events-wrap',
    label: 'Events Calendar',
    description: 'Display a list of events',
    category: 'events',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      eventsConfig: {
        name: 'Events',
        layout: 'list', // list, grid, cards
        eventsPerPage: 10,
        columns: 2, // For grid/cards layout
        gap: '24px',
        showFeaturedImage: true,
        showDescription: true,
        showDate: true,
        showTime: true,
        showLocation: true,
        showCategory: true,
        showPrice: true,
        showReadMore: true,
        readMoreText: 'View Details',
        filter: 'upcoming', // upcoming, past, all
        filterCategory: null, // null = all categories
        currency: '$', // $, £, or €
        containerStyle: {
          padding: '32px',
          background: 'transparent',
          borderRadius: '0'
        }
      },
      title: '',
      subtitle: ''
    }
  },
  {
    type: 'contact-form-input',
    label: 'Text Input',
    description: 'Single line text input field',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Name</label>
  <input type="text" name="name" placeholder="Enter your name" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'contact-form-email',
    label: 'Email Input',
    description: 'Email input field with validation',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Email</label>
  <input type="email" name="email" placeholder="your@email.com" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'contact-form-textarea',
    label: 'Text Area',
    description: 'Multi-line text area for messages',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Message</label>
  <textarea name="message" rows="4" placeholder="Enter your message..." style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; resize: vertical;"></textarea>
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'contact-form-dropdown',
    label: 'Dropdown',
    description: 'Dropdown select menu',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Subject</label>
  <select name="subject" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; background-color: white;">
    <option value="">Select a subject</option>
    <option value="general">General Inquiry</option>
    <option value="support">Support</option>
    <option value="sales">Sales</option>
  </select>
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'contact-form-checkbox',
    label: 'Checkbox',
    description: 'Single checkbox with label',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-bottom: 1rem; display: flex; align-items: center;">
  <input type="checkbox" name="subscribe" id="subscribe" style="width: 1rem; height: 1rem; margin-right: 0.5rem;" />
  <label for="subscribe" style="font-weight: 400; color: #374151; cursor: pointer;">Subscribe to our newsletter</label>
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'contact-form-submit',
    label: 'Submit Button',
    description: 'Form submit button',
    category: 'contact-form',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      columns: [{
        content: `<div style="margin-top: 1.5rem;">
  <button type="submit" style="width: 100%; padding: 0.75rem; background-color: #3b82f6; color: white; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer;">
    Submit
  </button>
</div>`,
        colWidth: 12
      }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  // User Access System (UAS) - Login Box
  {
    type: 'login-box',
    label: 'Login Box',
    description: 'Login form that shows status when logged in',
    category: 'user_access_system',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      loginConfig: {
        name: 'Login Box',
        showTitle: true,
        title: 'Sign In',
        showRememberMe: true,
        showForgotPassword: true,
        showRegisterLink: true,
        registerLinkText: "Don't have an account? Sign up",
        forgotPasswordText: 'Forgot your password?',
        submitButtonText: 'Sign In',
        welcomeText: 'Welcome back,',
        showDashboardLink: true,
        dashboardLinkText: 'Dashboard',
        showLogoutButton: true,
        logoutButtonText: 'Sign Out',
        containerStyle: {
          padding: '32px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          maxWidth: '400px',
          margin: '0 auto'
        }
      }
    }
  },
  // UAS Registration Form
  {
    type: 'register-form',
    label: 'Registration Form',
    description: 'User registration form',
    category: 'user_access_system',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      registerConfig: {
        name: 'Registration Form',
        showTitle: true,
        title: 'Create Account',
        subtitle: 'Enter your details to get started',
        showLoginLink: true,
        loginLinkText: 'Already have an account? Sign in',
        submitButtonText: 'Create Account',
        showFirstName: true,
        showLastName: true,
        showDisplayName: false,
        containerStyle: {
          padding: '32px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          maxWidth: '480px',
          margin: '0 auto'
        }
      }
    }
  },
  // UAS User Dashboard - can be added to any page
  {
    type: 'user-dashboard',
    label: 'User Dashboard',
    description: 'Dashboard section for logged-in users with profile and settings',
    category: 'user_access_system',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      dashboardConfig: {
        name: 'User Dashboard',
        showWelcome: true,
        welcomeText: 'Welcome back,',
        showProfileLink: true,
        showLogoutButton: true,
        showFeatureArea: true,
        featureAreaTitle: 'Quick Links',
        containerStyle: {
          padding: '32px',
          background: '#ffffff',
          borderRadius: '8px'
        }
      }
    }
  },
  // Note: forgot-password and verify-email are system pages only, not user-addable sections

  // ===== BOOKING SYSTEM =====
  // Booking Form - can be added to any page
  {
    type: 'booking-form',
    label: 'Booking Form',
    description: 'A booking/appointment form for customers to schedule services',
    category: 'booking',
    cols: 1,
    rows: 1,
    colWidths: [12],
    defaultContent: {
      bookingConfig: {
        title: 'Book an Appointment',
        subtitle: 'Select your preferred date and time',
        showServiceSelector: true,
        showStaffSelector: false,
        showDatePicker: true,
        showTimePicker: true,
        showPartySize: false,
        showNotes: true,
        buttonText: 'Book Now',
        layout: 'vertical',
        theme: 'default',
        primaryColor: '#8B5CF6',
        containerStyle: {
          padding: '2rem',
          background: 'transparent',
          borderRadius: '0'
        }
      }
    }
  },
]
