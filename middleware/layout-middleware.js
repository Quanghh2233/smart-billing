const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

/**
 * Middleware to support EJS layouts
 */
module.exports = (req, res, next) => {
    // Store the original render method
    const originalRender = res.render;

    // Override the render method
    res.render = function (view, options, callback) {
        options = options || {};

        // Set default layout if not specified
        if (options.layout === undefined) {
            options.layout = 'layouts/main';
        }

        // Store the original content
        const self = this;

        // Render the view as usual
        originalRender.call(this, view, options, function (err, html) {
            if (err) {
                return callback ? callback(err) : self.req.next(err);
            }

            // If no layout, just return the rendered content
            if (options.layout === false) {
                return callback ? callback(null, html) : self.send(html);
            }

            // Set body content for the layout
            options.body = html;

            // Find the layout file
            let layoutPath = options.layout;
            if (!layoutPath.endsWith('.ejs')) {
                layoutPath += '.ejs';
            }

            const layoutFilePath = path.join(self.app.get('views'), layoutPath);

            // Check if layout file exists
            if (!fs.existsSync(layoutFilePath)) {
                const err = new Error(`Layout ${options.layout} not found at ${layoutFilePath}`);
                return callback ? callback(err) : self.req.next(err);
            }

            // Render the layout with the body content
            originalRender.call(self, layoutPath, options, callback);
        });
    };

    next();
};
