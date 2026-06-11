import { Outlet } from 'react-router-dom';

export const NonProtectedRoutesLayout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};
