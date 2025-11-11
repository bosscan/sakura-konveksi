// Minimal module declarations to satisfy TypeScript without DefinitelyTyped packages
declare module 'express' { const e: any; export default e; }
declare module 'cors' { const c: any; export default c; }
declare module 'multer' { const m: any; export default m; }
declare module 'better-sqlite3' { const b: any; export default b; }
declare module 'uuid' { export const v4: any; }
declare module 'ws' { export const WebSocketServer: any; }
