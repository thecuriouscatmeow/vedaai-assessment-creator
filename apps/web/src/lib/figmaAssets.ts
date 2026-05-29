export const figmaAssets = {
  shell: {
    desktop: {
      logoMark: '/assets/logo_desktop.png',
      createAssignmentIcon:
        '/assets/figma/pages/00-layout/create-assignment.png',
      avatar: '/assets/figma/pages/00-layout/1-9752-avatar.png',
      nav: {
        home: '/assets/figma/pages/00-layout/home.png',
        assignments: '/assets/figma/pages/00-layout/assignments.png',
        myGroups: '/assets/figma/pages/00-layout/my-groups.png',
        aiToolkit: '/assets/figma/pages/00-layout/ai-toolkit.png',
        myLibrary: '/assets/figma/pages/00-layout/my-library.png',
        settings: '/assets/figma/pages/00-layout/settings.png',
      },
    },
    mobile: {
      logoMark: '/assets/logo_mobile.png',
      avatar: '/assets/figma/pages/00-layout/1-9752-avatar.png',
      bell: '/assets/figma/pages/00-layout/bell.png',
      menu: '/assets/figma/pages/00-layout/menu.png',
      back: '/assets/figma/pages/00-layout/back.png',
      tabs: {
        home: '/assets/figma/pages/00-layout/mobile/home.png',
        assignments: '/assets/figma/pages/00-layout/mobile/assignments.png',
        library: '/assets/figma/pages/00-layout/mobile/library.png',
        aiToolkit: '/assets/figma/pages/00-layout/mobile/ai-toolkit.png',
      },
    },
  },
  assignments: {
    empty: {
      background: '/assets/figma/pages/01-0-state-screen/desktop/assets/1-9723-background.png',
      illustration: '/assets/figma/pages/01-0-state-screen/empty_state.png',
    },
    filled: {
      cardBg: '/assets/figma/pages/02-filled-state/desktop/assets/1-9651-background.png',
      menuIcon: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9705-3309-8340-asset.svg',
    },
  },
  create: {
    uploadCloud: '/assets/figma/pages/03-upload-material-selector/desktop/assets/1-9390-asset.svg',
    uploadBackdrop: '/assets/figma/pages/03-upload-material-selector/desktop/assets/1-9383-asset.svg',
  },
  output: {
    headerArt: '/assets/figma/pages/04-assignment-output/desktop/assets/1-9809-image-3.png',
    collapseIcon: '/assets/figma/pages/04-assignment-output/desktop/assets/1-9822-frame.svg',
    downloadIcon: '/assets/figma/pages/04-assignment-output/desktop/assets/1-9853-asset.svg',
  },
} as const;
