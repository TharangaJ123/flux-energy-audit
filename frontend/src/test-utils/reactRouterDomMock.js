import React, { createContext, useContext, useMemo } from 'react';

const RouterContext = createContext({
  pathname: '/',
  navigate: () => {},
});

const getCurrentPath = () => window.location.pathname || '/';

const RouterProvider = ({ children, pathname = '/', navigate = () => {} }) => (
  <RouterContext.Provider value={{ pathname, navigate }}>
    {children}
  </RouterContext.Provider>
);

export const BrowserRouter = ({ children }) => (
  <RouterProvider pathname={getCurrentPath()}>{children}</RouterProvider>
);

export const MemoryRouter = ({ children, initialEntries = ['/'] }) => (
  <RouterProvider pathname={initialEntries[0] || '/'}>{children}</RouterProvider>
);

export const Routes = ({ children }) => {
  const { pathname } = useContext(RouterContext);
  const routeList = React.Children.toArray(children);
  const exactMatch = routeList.find((child) => child.props.path === pathname);
  const rootMatch = routeList.find((child) => child.props.path === '/');
  return exactMatch?.props.element || rootMatch?.props.element || null;
};

export const Route = () => null;

export const Link = ({ to, children, ...rest }) => (
  <a href={to} {...rest}>
    {children}
  </a>
);

export const useLocation = () => {
  const { pathname } = useContext(RouterContext);
  return useMemo(() => ({ pathname }), [pathname]);
};

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};
