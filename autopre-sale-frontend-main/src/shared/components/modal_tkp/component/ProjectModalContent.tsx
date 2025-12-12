
const ProjectModalContent = () => {
  return (
    <div className="project-modal">

      <div className="modal-grid">
        <div className="modal-three-columns">
          <div className="modal-column">
            <h3>Основные работы при подготовке документации</h3>
            {/* Здесь можно добавить список работ */}
          </div>
          <div className="modal-column">
            <h3>Состав команды</h3>
            {/* Здесь можно добавить состав команды */}
          </div>
          <div className="modal-column">
            <h3>Варианты аналитической документации</h3>
            {/* Здесь можно добавить варианты документации */}
          </div>
        </div>

        <div className="modal-section">
          <h2>Техническое решение</h2>
        </div>

        <div className="modal-section">
          <h2>Особенности реализации проекта</h2>
        </div>

        <div className="modal-section">
          <h2>Референсы</h2>
        </div>

        <div className="modal-section">
          <h2>Этапы реализации проекта</h2>
        </div>

        <div className="modal-section">
          <h2>Базовые решения</h2>
        </div>

        <div className="modal-section">
          <h2>Сроки и стоимость</h2>
        </div>

        <div className="modal-section">
          <h2>Варианты аналитической документации</h2>
        </div>
      </div>
    </div>
  );
};

export default ProjectModalContent;