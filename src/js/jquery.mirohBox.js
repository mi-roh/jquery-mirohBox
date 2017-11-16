/*!
 * jquery-mirohBox
 *
 * implements
 *
 * .mirohBox()
 *
 * SDG
 *
 * @version     0.1.0
 * @author      Micha Rohde <hi@mi-roh.de>
 * @copyright   Copyright (c) 2016 Micha Rohde
 *
 */

/* globals jQuery, window */

( function( $, w, n, c ) {

    /**
     * Set Constants for status comparing
     * @type {number}
     */
    var STATUS_INITIAL = 0,
        STATUS_OPENING = 1,
        STATUS_OPEN = 2,
        STATUS_CLOSING = 3,
        STATUS_CLOSED = 4,
        STATUS_ERROR = -1;

    /**
     * Set Constants for content Types
     * @type {string}
     */
    var CONTENT_TYPE_CONTENT = 'content',
        CONTENT_TYPE_I_FRAME = 'iframe',
        CONTENT_TYPE_AJAX = 'ajax',
        CONTENT_TYPE_AUTO = 'auto';

    /**
     * A Event that will be called during the Open and Close-Precess (and maybe others)
     *
     * @callback customEvent
     * @param event {null|object} the Event that triggered this call
     * @param name {string} the name of the Event
     * @param customActions {object} A List of custom Actions to call (close Action)
     * @param data {object} Custom Data passed to the Event
     * @param options {object} the Current Configuration of the Box
     * @returns {*}
     */

    /**
     * A Function that gets called when the corresponding contentType
     * is used to generate the Content
     *
     * @callback contentGenerator
     * @param openCall {openContentCall} Fire this Event to open the Layer and show the Content
     * @param options {object} the options of the current Call
     * @param $rootEle {HTMLElement|null} the Element that opened the Bpx
     * @param urlCall {urlCall} A Function to get the corresponding url
     * @param errorCall {openErrorCall} the Current Configuration of the Box
     * @param currentInstance {mirohBox}
     */

    /**
     * A Function that gets detects if the corresponding contentType
     * shall be used with the contentType auto
     *
     * @todo implement
     *
     * @callback autoDetect
     * @returns {boolean}
     */

    /**
     * A Function that gets Called to generate the corresponding Content of
     * the contentType
     *
     * @callback openContentCall
     * @param content {HTMLElement} the Content to show in the Box
     */

    /**
     * Function to get the corresponding url, depending on the optons.
     * If option.url is a function, call the function as urlOption
     * If option.url is string - use as it is
     * If is false - try to get the href-Parameter of the $rootEle
     *
     * @callback urlCall
     * @return {string|boolean}
     */

    /**
     * A Function that gets Called if the Content generation fails
     *
     * @callback openErrorCall
     * @param content {string|HTMLElement} with a error-Message
     */

    /**
     * Function to generate an individual URL for the call
     *
     * @callback urlOption
     * @param $rootEle {HTMLElement} the Element the Event came from
     * @param options {object} the Options of the current Box
     * @return {string|boolean} the URL to show or false if no valid URL
     */

    ///////////////// DEFAULT OPTIONS

    var defaultOptions = {
        /**
         * The Content to Display
         * string: Display the String as Content
         * HTMLElement: Display the element
         * function: Call Function and display the returned Value (string|HTMLElement)
         * returns false of no Content is set
         *
         * @type {string|HTMLElement|function|boolean}
         */
        content: false,

        /**
         * Content Type that shall be used
         * auto: Detect by Configuration
         * other Types defined by addContentType()
         *
         * @type {string}
         */
        contentType: CONTENT_TYPE_AUTO,

        /**
         * default Event for eventOpen and eventClose
         *
         * @type {string|boolean}
         */
        event: 'click.mirohBox',

        /**
         * events that open the Layer
         * false: use .event
         *
         * @type {string|boolean}
         */
        eventOpen: false,

        /**
         * events that close the Layer
         * false: use .event
         *
         * @type {string|boolean}
         */
        eventClose: false,

        /**
         * Close in BackgroundClick
         *
         * Closes the Layer if the eventClose is triggered on the $background
         *
         * @type {boolean}
         */
        closeOnBackground: true,

        /**
         * Close in CloseClick
         *
         * Closes the Layer if the eventClose is triggered on the $close
         *
         * @type {boolean}
         */
        closeOnClose: true,

        /**
         * URL to use
         *
         * string: use as URL
         * function: call and use return as URL
         * false: no URL set, try to get the href-attribute
         *
         * @type {string|urlOption|boolean}
         */
        url: false,

        /**
         * Change the default Transition Speed for this configuration
         *
         * @type {boolean}
         * false: use the DefaultTransition Speed
         * 0: don't fade @todo Disable CSS-Transition
         * >0: Use Transition for CSS
         */
        customTransitionSpeed: false,

        /**
         * Add Class
         *
         * @type {string}
         */
        class: '',

        /**
         * the zIndex of the Layer as a css attribute in a style-Attribute
         *
         * default: zIndex of the CSS (10000)
         *
         * @type {null|number}
         */
        zIndex: null,

        /**
         * Event to load before the Box gets opened
         *
         * @type {customEvent}
         */
        onOpen: function() {

            // console.info( 'custom Evt open', arguments );
        },

        /**
         * Event to load after the Box got opened
         *
         * @type {customEvent}
         */
        onOpened: function() {

            // console.info( 'custom Evt opened', arguments );
        },

        /**
         * Event to load before the Box gets closed
         *
         * @type {customEvent}
         */
        onClose: function() {

            // console.info( 'custom Evt close', arguments );
        },

        /**
         * Event to load after the Box got closed
         *
         * @type {customEvent}
         */
        onClosed: function() {

            // console.info( 'custom Evt closed', arguments );
        },

        /**
         * Ajax-Configuration Object as base for the Ajax-Call
         *
         * @type {*}
         */
        ajaxConfig: {

        }
    };

    ///////////////// VARIABLES

    /**
     * List of the different ContentTypes added Via internal addContentType()
     * or global $.mirohBox.addContentType()
     * @type {{}}
     */
    var contentTypes = {};

    /**
     * Class to add to <html> for the Time a Box is open
     * @type {string}
     */
    var isOpenHtmlClass = 'mirohBox-is-open',
        /**
         * Class added to $box when Box is closed
         * @type {string}
         */
        isClosedClass = 'mirohBox-is-closed',
        /**
         * Class added to $box when Box is Loading/Opening
         * @type {string}
         */
        isOpeningClass = 'mirohBox-is-opening',
        /**
         * Class added to $box when Box is opened
         * @type {string}
         */
        isOpenedClass = 'mirohBox-is-open',
        /**
         * Class added to $box when Box is Closing/Unloading
         * @type {string}
         */
        isClosingClass = 'mirohBox-is-closing';

    /**
     * Number of Instances of open Layers.
     * @type {number}
     */
    var openInstances = 0;

    /**
     * Set constants for Operating System comparing and set Operating System
     */
    var OS_UNKNOWN = 'unknown',
        OS_MAC = 'macOS',
        OS_I = 'iOS',
        OS_WINDOWS = 'windows',
        OS_ANDROID = 'android',
        OS_UNIX = 'unix',
        OS_LINUX = 'linux',
        OS = ( function( appVersion, userAgent, platform ) {
            if ( appVersion.indexOf( 'Mac' ) !== -1 ) {
                return OS_MAC;
            } else if ( [ 'iPhone', 'iPad', 'iPod' ].indexOf( platform ) !== -1 ) {
                return OS_I;
            } else if ( appVersion.indexOf( 'Win' ) !== -1 ) {
                return OS_WINDOWS;
            } else if ( /Android/.test( userAgent ) ) {
                return OS_ANDROID;
            } else if ( appVersion.indexOf( 'X11' ) !== -1 ) {
                return OS_UNIX;
            } else if ( appVersion.indexOf( 'Linux' ) !== -1 ) {
                return OS_LINUX;
            }
            return OS_UNKNOWN;
        }( n.appVersion, n.userAgent, n.platform ) );

    ///////////////// HELPER

    /**
     * Builds an Object with the given custom Option
     * Sets some Options, if they are not defined in the custom Options
     * @param [baseOptions] - An Set of existing customOptions
     * @param customOptions - Option Array similar to defaultOptions
     * @returns {*}
     */
    var getOptions = function( baseOptions, customOptions ) {

        baseOptions = baseOptions || {};
        customOptions = customOptions || {};

        var options = $.extend( {}, defaultOptions, baseOptions, customOptions );
        if ( options.eventOpen === false ) {
            options.eventOpen = options.event;
        }
        if ( options.eventClose === false ) {
            options.eventClose = options.event;
        }
        return options;
    };

    /**
     * Returns an Attribute of an html-Element
     * @param {HTMLElement} $item html-Element
     * @param {string} attr the Attribute to get
     * @returns {string|boolean} return the Value or fals if not set
     */
    var getAttribute = function( $item, attr ) {
        var value;
        var status =
            !!$item && ( value = $item.attr( attr ) ) &&
            typeof value !== typeof undefined && value !== false;
        return status ? value : false;
    };

    /**
     * Logs the Errors. To globally disable Logs
     * @param message
     */
    var logError = function( message ) {
        c.log.apply( c, arguments );
    };

    ///////////////// THE JQUERY PLUGIN

    /**
     * Check if Plugins are available
     * @type {{}}
     */
    $.fn = $.fn || {};

    /**
     * Add jQuery-Plugin for HTMLElements
     * @param {string} [select] a magic selector
     * @param {*} [customOptions] options to overwrite the defaultOptions
     * @returns {*|HTMLElement}
     */
    $.fn.mirohBox = function( select, customOptions ) {

        // Push Parameters
        if ( 'undefined' === typeof customOptions && 'object' === typeof select ) {
            customOptions = select;
            select = null;
        }

        var t = this,
            $this = $( t, select ),
            options = getOptions( customOptions );

        $this.on( options.eventOpen, function( e ) {
            new mirohBox( options, $( t ), e );

            e.preventDefault();
        } );

        return $( t );
    };

    /**
     * Add jQuery-Plugin for direct access
     * @type {jQuery.mirohBox}
     */
    var jqueryMirohBox = $.mirohBox = function( options ) {
        var box = new mirohBox( getOptions( options ) );

        return box._publicActions;
    };

    /**
     * Add Direct access to add Custom Content Types
     *
     * @param name {string} the Name of the custom Content Type
     * @param contentGenerator {contentGenerator} a Function that generates the Content to display
     * @param autoDetect {null|autoDetect} a Function that helps to detect the content
     *                  of contentType is auto
     *                  if Null - no autodetection
     */
    var addContentType = jqueryMirohBox.addContentType = function( name, contentGenerator, autoDetect ) {
        contentTypes[ name ] = [
            contentGenerator,
            autoDetect
        ];
    };

    /**
     * Add Direct access to overwrite the default transition Speed
     * Important: always sync this number with the transition Speed in the sass-File!
     *
     * @type {number}
     */
    var transitionSpeed = jqueryMirohBox.transitionSpeed = 300;

    ///////////////// THE ACTUAL PLUGIN

    /**
     * The Actual Plugin
     * @param options
     * @param $rootElement
     * @param event
     */
    var mirohBox = function( options, $rootElement, event ) {

        var t = this;

        /**
         * Status:always set by STATUS-Constants
         * @type {number}
         */
        t.status = STATUS_INITIAL;

        /**
         * The Element that opend the Layer (f.e. the Clicked Link)
         * @type {HTMLElement|null}
         */
        t.$rootEle = $rootElement;

        /**
         * The Configuration. A Merge of the defaultOptions and the customOptions
         * @type {*}
         */
        t.options = options;

        /**
         * The Event of opening
         * @type {*}
         */
        t.openEvent = event;

        /**
         * The Event of closing
         * @type {*}
         */
        t.closeEvent = {};

        t._publicActions = {
            close: function( target, e ) {
                t.close( target, e );
            },
            updateOptions: function( options ) {
                t.updateOptions( options );
            }
        };

        // build the Layer
        t.buildLayer();

        // open the Layer
        t.open();
    };

    /**
     * prototype
     * @type {any}
     */
    var proto = mirohBox.prototype;

    /**
     * build the HTML of the Layer
     * store the Elements in the Object for fast access
     * bind Events the the Layer
     * Append the Layer to the Content
     */
    proto.buildLayer = function() {

        var t = this;

        /**
         * <html>
         * @type {HTMLElement}
         */
        t.$html = $( 'html' );

        /**
         * The Root-Containter of the Layer
         */
        t.$root = $( '<div class="mirohBox mirohBox-root">' )
            .addClass( 'mirohBox-OS-' + OS )
            .addClass( isClosedClass )
            .addClass( t.options.class );

        if ( t.options.zIndex > 0 ) {
            t.$root.css( {
                'z-index': t.options.zIndex
            } );
        }

        /**
         * The Layer to display in the Background and Enable on-Click to close
         *
         * @todo add Pointer to Background if closeOnClose === true
         */
        t.$background = $( '<div class="mirohBox-background">' )
            .appendTo( t.$root )
            .on( t.options.eventClose, function( e ) {
                if ( t.options.closeOnBackground ) {
                    t.close( 'background', e );
                }
            } );

        /**
         * The Loader - Only displayed if the Content won't be shown immediately
         */
        t.$loader = $( '<div class="mirohBox-loader">' )
            .appendTo( t.$root )
            .hide();

        /**
         * A container for Possitioning
         */
        t.$box = $( '<div class="mirohBox-box">' )
            .appendTo( t.$root );

        /**
         * A Wrapper of the Box
         */
        t.$wrapper = $( '<div class="mirohBox-wrapper">' )
            .appendTo( t.$box );

        /**
         * The Content of the Box
         */
        t.$content = $( '<div class="mirohBox-content">' )
            .appendTo( t.$wrapper );

        /**
         * The Close X in the Top left/right corner
         */
        t.$close = $( '<div class="mirohBox-close">' )
            .appendTo( t.$wrapper )
            .on( t.options.eventClose, function( e ) {
                if ( t.options.closeOnClose ) {
                    t.close( 'close', e );
                }
            } );

        // Append the Layer to the <body>
        t.$root.appendTo( 'body' );

        // Add Changeable Options
        t.updateView();
    };

    /**
     * Update the Options
     * (not all Options are updateable)
     *
     * @param {object} options
     */
    proto.updateOptions = function( options ) {

        var t = this;

        t.options = getOptions( t.options, options );

        t.updateView( options );
    };

    /**
     * Update the Changeable Options
     */
    proto.updateView = function( oldOptions ) {

        oldOptions = oldOptions || {};

        var t = this,
            closeOnClickClass = 'mirohBox-close-on-click';

        // Close on Background
        if ( t.options.closeOnBackground ) {
            t.$background.addClass( closeOnClickClass );
        } else {
            t.$background.removeClass( closeOnClickClass );
        }

        // Close on Close
        if ( t.options.closeOnClose ) {
            t.$close.addClass( closeOnClickClass );
        } else {
            t.$close.removeClass( closeOnClickClass );
        }

        // @todo add options.class?
    };

    /**
     * Open the Layer
     */
    proto.open = function() {

        var t = this,
            $root = t.$root,
            $rootEle = t.$rootEle,
            options = t.options,
            contentType = t.getContentType();

        // No Valid Content Type - Error
        if ( contentType === false ) {
            logError( 'no Valid ContentType' );
            t.status = STATUS_ERROR;
            return;
        }

        // Set Status
        t.status = STATUS_OPENING;

        // Hide close if is disabled
        if ( !options.closeOnClose ) {
            t.$close.hide();
        }

        // Display the Layer
        t.$html.addClass( isOpenHtmlClass );
        openInstances++;

        // Trigger the custom Open-Event before every thing else
        t.fireEvent( 'onOpen', t.openEvent );

        // Start the Opening Process
        $root
            .addClass( isOpeningClass )
            .removeClass( isClosedClass );

        // Only show Loader if it won't only blink
        w.setTimeout( function() {
            if ( t.status < STATUS_OPEN && t.status > STATUS_ERROR ) {
                t.$loader.show();
            }
        }, 2 );

        // Call the Layout Function for the Content
        /**
         * @type contentGenerator
         */
        contentTypes[ contentType ][ 0 ](
            /**
             * @type openContentCall
             */
            function( content ) {     // Function to Call with Content
                w.setTimeout( function() {
                    t.opened( content );
                }, 1 );
            },
            options,                // Options
            $rootEle,               // Root Element
            /**
             * @type urlCall
             */
            function() {            // Function to call, to get the url
                var url = options.url || getAttribute( $rootEle, 'href' ),
                    /**
                     * @type urlOption
                     */
                    urlFunction;

                // function is @type urlOption
                if ( 'function' === typeof url ) {
                    urlFunction = url;
                    url = urlFunction( $rootEle, options );
                }
                return url;
            },
            function( message ) {     // Function to call if there is an Error
                t.openedFailed( message );
            },
            t
         );

    };

    /**
     * Function gets Called when the content is loaded and the Layer shall be displayed.
     *
     * @param {HTMLElement} $content Content to Display
     */
    proto.opened = function( $content ) {
        var t = this;

        // Set Status
        t.status = STATUS_OPEN;

        // Get Sure the Content is jQuery and Append
        t.$content.append( $content );

        // Update classes and Visibility
        t.$root
            .addClass( isOpenedClass )
            .removeClass( isOpeningClass );
        t.$loader.hide();

        // Trigger the Custom Opened event wenn every thing is completed
        t.fireEvent( 'onOpened', t.openEvent, {
            $content: t.$content
        } );
    };

    /**
     * Gets called when Open Faild
     * @param message
     */
    proto.openedFailed = function( message ) {
        var t = this;
        t.status = STATUS_ERROR;
        t.opened( '<div>' + message  + '</div>' );
    };

    /**
     *
     * @param {string} target
     * @param {*} e Event Data
     */
    proto.close = function( target, e ) {

        var t = this;
        if ( !target ) {
            target = 'custom';
        }

        // Set Event and Status
        t.closeEvent = e;
        t.status = STATUS_CLOSING;

        // Trigger custom close Event before every thing else
        t.fireEvent( 'onClose', e, {
            type: target
        } );

        // Start closing Process
        t.$root
            .addClass( isClosingClass )
            .removeClass( isOpenedClass );

        // Add the Transition-Delay so the CSS can style the closing -process
        w.setTimeout( function() {

            // Remove the Layer
            t.$root.remove();

            // set the Status
            t.status = STATUS_CLOSED;

            // Trigger custom close Event after Closing
            t.fireEvent( 'onClosed', e, {
                type: target
            } );

            // If last Box got closed, remove the open-Class from <html>
            if ( --openInstances <= 0 ) {
                openInstances = 0;
                t.$html.removeClass( isOpenHtmlClass );
            }

        }, t.options.customTransitionSpeed || transitionSpeed );

    };

    /**
     * Trigger a custom Event
     *
     * @param {string} name name of the Event to call
     * @param {*|null} event the Event that triggerd
     * @param {*} [data] an object with Data passed to the custom Event
     * @returns {*} Return Value of the custom Event
     */
    proto.fireEvent = function( name, event, data ) {

        var t = this,
            /**
             * @type {customEvent}
             */
            action = t.options[ name ];

        // Validate Data
        if ( 'object' !== typeof data ) {
            data = {};
        }

        // check if is Function
        if ( 'function' !== typeof action ) {
            return null;
        }

        // Apply Data and Return the Result
        return action.apply( t.$box, [
            event,
            name,
            t._publicActions,
            data,
            t.options
        ] );

    };

    /**
     * Gets the ContentType that shall be loaded
     * @returns {string|boolean} returns false if the Contenttype isn't valid
     */
    proto.getContentType = function() {
        var t = this,
            options = t.options,
            checkType = options.contentType;

        if ( checkType === CONTENT_TYPE_AUTO ) {
            if ( options.content !== false ) {

                // Content Defined
                checkType = CONTENT_TYPE_CONTENT;
            } else if ( false !== getAttribute( t.$rootEle, 'href' )  ) {

                // Has Attribute href -> Load as iframe
                checkType = CONTENT_TYPE_I_FRAME;
            } else if ( !!options.url ) {

                // Load as Ajax
                checkType = CONTENT_TYPE_AJAX;
            }

        }

        if ( !contentTypes[ checkType ] ) {
            return false;
        }
        return checkType;
    };

    ///////////////// ADD CONTENT TYPE

    /**
     * Add Content Type 'content' for passing the Content via the content-Attribute
     */
    addContentType(
        CONTENT_TYPE_CONTENT,
        /**
         * @type {contentGenerator}
         */
        function( openCall, options, $rootEle, url, errorCall, currentInstance ) {

            // Geht the Content from the Var
            var content = options.content;

            // if is Function - Call the Function
            if ( 'function' === typeof content ) {
                content = content( $rootEle, options, currentInstance._publicActions );
            }

            // if is String - wrap into <div> to make shure the transformation into jQuery Works
            if ( 'string' === typeof content ) {
                content = '<div>' + content + '</div>';
            }

            // Open
            openCall( $( content ) );
        }
     );

    /**
     * Add Content Type 'ajax' for Loading Content via Ajax
     */
    addContentType(
        CONTENT_TYPE_AJAX,
        /**
         * @type {contentGenerator}
         */
        function( openCall, options, $rootEle, urlCall, errorCall, currentInstance ) {

            // Get Ajax Options
            var config = typeof {} === typeof options.ajaxConfig ? options.ajaxConfig : {},

                // Ajax Status for bulletproof error Handling
                ajaxSuccessStatus = false,

                // Get the URL
                url = urlCall();

            // Overwrite the most important configs
            config = $.extend( {}, config, {
                url: url,
                success: function( data, textStatus, jqXHR ) {

                    // @todo add a option to apply custom success functions

                    ajaxSuccessStatus = true;

                    //  Success - Open
                    openCall( data );
                },
                complete: function( jqXHR, textStatus ) {

                    if ( !ajaxSuccessStatus ) {

                        // @todo add a option to apply custom complete functions
                        // Error
                        errorCall( '<div>Error: ' + textStatus + '</div>' );
                    }
                }
            } );

            // Call the Ajax
            $.ajax( config );
        }
     );

    /**
     * Add Content Type 'iframe' to Load a Page into an iframe
     */
    addContentType(
        CONTENT_TYPE_I_FRAME,
        /**
         * @type {contentGenerator}
         */
        function( openCall, options, $rootEle, urlCall, errorCall, currentInstance ) {

            // Get the URL
            var url = urlCall(),

                // Build a Load-Wrapper to load the Content out of the Box
                $loader = $(
                        '<div style="overflow:hidden; width: 1px; height: 1px; opacity: 0.01;">'
                    ).appendTo( 'body' ),

                // Build the iframe - when loaded, remove from the Load-Wrapper and open in Box
                $iFrame = $( '<iframe />' )
                    .appendTo( $loader )
                    .attr( 'src', url )
                    .on( 'load', function() {

                        // Open
                        openCall( $iFrame );

                        // remove Load-Wrapper
                        w.setTimeout( function() {
                            $loader.remove();
                        }, 10 );
                    } );
        }
    );

}( jQuery, window, window.navigator, window.console ) );
