import { useTheme } from '../context/ThemeContext.jsx';
import { VscCheck } from 'react-icons/vsc';

export default function ThemeSwitcher() {
  const { themeId, themes, changeTheme } = useTheme();

  const themeColors = {
    light: ['#ffffff', '#f0f2f5', '#1a1a2e'],
    dark: ['#0f0f1a', '#1a1a2e', '#e8eaed'],
    ocean: ['#0c1929', '#0f2847', '#d4e8f5'],
    forest: ['#0f1a0f', '#1a2e1a', '#d4edd4'],
    sunset: ['#1a0f0f', '#2e1a1a', '#edd4d4'],
  };

  return (
    <div className="theme-switcher">
      {themes.map((t) => {
        const colors = themeColors[t.id];
        const isActive = themeId === t.id;
        return (
          <div
            key={t.id}
            className={`theme-option ${isActive ? 'active' : ''}`}
            onClick={() => changeTheme(t.id)}
          >
            <div style={{ display: 'flex', gap: 3 }}>
              {colors.map((c, i) => (
                <div key={i} className="theme-swatch" style={{ background: c, borderColor: i === 2 ? 'transparent' : undefined }} />
              ))}
            </div>
            <span className="theme-label">{t.name}</span>
            {isActive && <span className="theme-check"><VscCheck /></span>}
          </div>
        );
      })}
    </div>
  );
}