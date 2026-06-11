export const ROUTE_PATHS = {
  ROOT: '/',
  DOC_ID: '/doc/:id',
  MATCH_ALL: '*',
  VERSION_HISTORY_VIEW: '/doc/:id/history',
  PUBLIC_SHARE_LINK: '/shared/:token',
} as const;