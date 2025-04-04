/**
 * Typography used in theme
 * @param {JsonObject} theme theme customization object
 */
export function themeTypography(theme) {
    const baseFontSize = theme.fontSize || 14;
    return {
        fontFamily: theme.customization.fontFamily,
        fontSize: baseFontSize,
        h6: {
            fontWeight: 500,
            color: theme.heading,
            fontSize: `${baseFontSize - 4}px`
        },
        h5: {
            fontSize: `${baseFontSize - 2}px`,
            color: theme.heading,
            fontWeight: 500
        },
        h4: {
            fontSize: `${baseFontSize}px`,
            color: theme.heading,
            fontWeight: 600
        },
        h3: {
            fontSize: `${baseFontSize + 2}px`,
            color: theme.heading,
            fontWeight: 600
        },
        h2: {
            fontSize: `${baseFontSize + 4}px`,
            color: theme.heading,
            fontWeight: 700
        },
        h1: {
            fontSize: `${baseFontSize + 8}px`,
            color: theme.heading,
            fontWeight: 700
        },
        subtitle1: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.textDark
        },
        subtitle2: {
            fontSize: '0.75rem',
            fontWeight: 400,
            color: theme.darkTextSecondary
        },
        caption: {
            fontSize: '0.75rem',
            color: theme.darkTextSecondary,
            fontWeight: 400
        },
        body1: {
            fontSize: `${baseFontSize}px`,
            fontWeight: 400,
            lineHeight: '1.334em'
        },
        body2: {
            letterSpacing: '0em',
            fontWeight: 400,
            lineHeight: '1.5em',
            color: theme.darkTextPrimary
        },
        customInput: {
            marginTop: 8,
            marginBottom: 8,
            '& > label': {
                top: '23px',
                left: 0,
                color: theme.grey500,
                '&[data-shrink="false"]': {
                    top: '5px'
                }
            },
            '& > div > input': {
                padding: '30.5px 14px 11.5px !important'
            },
            '& legend': {
                display: 'none'
            },
            '& fieldset': {
                top: 0
            }
        },
        mainContent: {
            backgroundColor: theme.background,
            width: '100%',
            minHeight: 'calc(100vh - 88px)',
            flexGrow: 1,
            padding: '20px',
            marginTop: '88px',
            marginRight: '20px',
            borderRadius: theme.customization.borderRadius + 'px'
        },
        menuCaption: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.heading,
            padding: '6px',
            textTransform: 'capitalize',
            marginTop: '10px'
        },
        subMenuCaption: {
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: theme.darkTextSecondary,
            textTransform: 'capitalize'
        },
        commonAvatar: {
            cursor: 'pointer',
            borderRadius: '8px'
        },
        smallAvatar: {
            width: '22px',
            height: '22px',
            fontSize: '1rem'
        },
        mediumAvatar: {
            width: '34px',
            height: '34px',
            fontSize: '1.2rem'
        },
        largeAvatar: {
            width: '44px',
            height: '44px',
            fontSize: '1.5rem'
        }
    };
}
