export const figmaAssets = {
  shell: {
    desktop: {
      logoMark: '/assets/logo_desktop.png',
      createAssignmentIcon:
        '/assets/figma/pages/02-filled-state/desktop/assets/1-9659-asset.svg',
      avatar: '/assets/figma/pages/00-layout/1-9752-avatar.png',
      nav: {
        home: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9447-3309-8164-asset.svg',
        assignments: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9666-3309-5708-asset.svg',
        myGroups: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9666-3309-5709-asset.svg',
        aiToolkit: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9666-3309-5710-asset.svg',
        myLibrary: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9666-3309-5711-asset.svg',
        settings: '/assets/figma/pages/02-filled-state/desktop/assets/I1-9666-3309-5712-asset.svg',
      },
    },
    mobile: {
      logoMark: '/assets/logo_mobile.png',
      avatar: '/assets/figma/pages/00-layout/1-9752-avatar.png',
      bell: '/assets/figma/pages/00-layout/bell.png',
      menu: '/assets/figma/pages/00-layout/menu.png',
      back: '/assets/figma/pages/00-layout/back.png',
      tabs: {
        home: '/assets/figma/pages/02-filled-state/mobile/assets/1-10351-component-1.svg',
        assignments: '/assets/figma/pages/02-filled-state/mobile/assets/1-10308-union.svg',
        library: '/assets/figma/pages/02-filled-state/mobile/assets/1-10312-union.svg',
        aiToolkit: '/assets/figma/pages/02-filled-state/mobile/assets/1-10299-combined-shape.svg',
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
