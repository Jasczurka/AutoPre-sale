import {
    mdiLogout,
    mdiFolderMultiple,
    mdiChartBox,
    mdiFileDocument, mdiMagnify,
    mdiPlus,
    mdiFolderOpenOutline,
    mdiMenuDown,
    mdiCheck,
    mdiDotsVertical,
    mdiChevronLeft,
    mdiChevronRight,
    mdiDownload,
    mdiWindowClose,
    mdiUpload,
    mdiMinus,
    mdiAlert,
    mdiLoading, mdiFormatListGroupPlus, mdiCheckCircle, mdiInformation, mdiAlertCircle, mdiDelete
} from "@mdi/js"

const ICON_PATH = {
    LOGOUT: mdiLogout,
    FOLDER_COPY: mdiFolderMultiple,
    ANALYSIS: mdiChartBox,
    DESCRIPTION: mdiFileDocument,
    SEARCH: mdiMagnify,
    ADD: mdiPlus ,
    ADD_MULTIPLE: mdiFormatListGroupPlus,
    OPEN_FOLDER: mdiFolderOpenOutline,
    ARROW_DROP_DOWN: mdiMenuDown ,
    DONE: mdiCheck ,
    MORE_VERT: mdiDotsVertical ,
    KEYBOARD_ARROW_LEFT: mdiChevronLeft ,
    KEYBOARD_ARROW_RIGHT: mdiChevronRight,
    DOWNLOAD: mdiDownload ,
    PROGRESS_ACTIVITY: mdiLoading ,
    CROSS: mdiWindowClose ,
    UPLOAD: mdiUpload ,
    REMOVE: mdiMinus ,
    ALERT_WARNING: mdiAlert,
    ALERT_SUCCESS: mdiCheckCircle,
    ALERT_INFO: mdiInformation,
    ALERT_ERROR: mdiAlertCircle,
    DELETE: mdiDelete,
} as const

//export type EIconPath = typeof EIconPath[keyof typeof EIconPath]

export { ICON_PATH }