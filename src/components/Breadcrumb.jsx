import { useFiles } from '../context/FileContext.jsx';
import { VscChevronRight, VscHome } from 'react-icons/vsc';

export default function Breadcrumb() {
  const { currentPath, navigate } = useFiles();
  const parts = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  const handleClick = (index) => {
    if (index === -1) {
      navigate('/');
      return;
    }
    const path = '/' + parts.slice(0, index + 1).join('/');
    navigate(path);
  };

  return (
    <div className="breadcrumb">
      <span
        className={`breadcrumb-item ${currentPath === '/' ? 'active' : ''}`}
        onClick={() => handleClick(-1)}
      >
        <VscHome style={{ fontSize: 15 }} /> Home
      </span>
      {parts.map((part, index) => (
        <span key={index} style={{ display: 'flex', alignItems: 'center' }}>
          <span className="breadcrumb-sep"><VscChevronRight /></span>
          <span
            className={`breadcrumb-item ${index === parts.length - 1 ? 'active' : ''}`}
            onClick={() => handleClick(index)}
          >
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}