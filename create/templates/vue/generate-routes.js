const templateIf = require('../../utils/template-if');
const indent = require('../../utils/indent');

module.exports = (options) => {
  const { template } = options;

  if (template === 'blank') {
    return indent(
      0,
      `
      import HomePage from '../pages/home.vue';

      var routes = [
        {
          path: '/',
          component: HomePage,
        },
      ];

      export default routes;
    `,
    );
  }

  // Vite Routes
  // prettier-ignore
  const routes = indent(0, /* js */`
    import HomePage from '../pages/home.vue';
    import AboutPage from '../pages/about.vue';
    import FormPage from '../pages/form.vue';
    ${templateIf(template === 'tabs', () => `
    import CatalogPage from '../pages/catalog.vue';
    import ProductPage from '../pages/product.vue';
    import SettingsPage from '../pages/settings.vue';
    `)}
    ${templateIf(template === 'split-view', () => `
    import LeftPage1 from '../pages/left-page-1.vue';
    import LeftPage2 from '../pages/left-page-2.vue';
    `)}
    import DynamicRoutePage from '../pages/dynamic-route.vue';
    import RequestAndLoad from '../pages/request-and-load.vue';
    import NotFoundPage from '../pages/404.vue';

    var routes = [
      {
        path: '/',
        component: HomePage,
      },
      {
        path: '/about/',
        component: AboutPage,
      },
      {
        path: '/form/',
        component: FormPage,
      },
      ${templateIf(template === 'tabs', () => `
      {
        path: '/catalog/',
        component: CatalogPage,
      },
      {
        path: '/product/:id/',
        component: ProductPage,
      },
      {
        path: '/settings/',
        component: SettingsPage,
      },
      `)}
      ${templateIf(template === 'split-view', () => `
      {
        path: '/left-page-1/',
        component: LeftPage1,
      },
      {
        path: '/left-page-2/',
        component: LeftPage2,
      },
      `)}
      {
        path: '/dynamic-route/blog/:blogId/post/:postId/',
        component: DynamicRoutePage,
      },
      {
        path: '/request-and-load/user/:userId/',
        async: function ({ router, to, resolve }) {
          // App instance
          var app = router.app;

          // Show Preloader
          app.preloader.show();

          // User ID from request
          var userId = to.params.userId;

          // Simulate Ajax Request
          setTimeout(function () {
            // We got user data from request
            var user = {
              firstName: 'Vladimir',
              lastName: 'Kharlampidi',
              about: 'Hello, i am creator of Framework7! Hope you like it!',
              links: [
                {
                  title: 'Framework7 Website',
                  url: 'http://framework7.io',
                },
                {
                  title: 'Framework7 Forum',
                  url: 'http://forum.framework7.io',
                },
              ]
            };
            // Hide Preloader
            app.preloader.hide();

            // Resolve route to load page
            resolve(
              {
                component: RequestAndLoad,
              },
              {
                props: {
                  user: user,
                }
              }
            );
          }, 1000);
        },
      },
      {
        path: '(.*)',
        component: NotFoundPage,
      },
    ];

    export default routes;
  `);

  return routes;
};
