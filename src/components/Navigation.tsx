import { NavLink } from 'react-router-dom';

export const Navigation = () => {
  return (
    <nav>
      <NavLink
        to={`video-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Video check
      </NavLink>
      <NavLink
        to={`speaker-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Speaker check
      </NavLink>
      <NavLink
        to={`mic-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Microphone check
      </NavLink>
      <NavLink
        to={`network-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Network check
      </NavLink>
      <NavLink
        to={`connection-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Connection check
      </NavLink>
      <NavLink
        to={`websockets-check`}
        className={({ isActive }) => (isActive ? 'active' : 'nav')}
      >
        Websocket check
      </NavLink>
      <a href="/" className="nav">
        Restart
      </a>
    </nav>
  );
};
