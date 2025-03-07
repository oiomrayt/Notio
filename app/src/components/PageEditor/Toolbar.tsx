import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';

// Иконки
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaCode,
  FaHeading,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaImage,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from 'react-icons/fa';

// Типы блоков форматирования
const BLOCK_TYPES = [
  { format: 'heading-1', icon: <FaHeading size={16} />, title: 'Заголовок 1' },
  { format: 'heading-2', icon: <FaHeading size={14} />, title: 'Заголовок 2' },
  { format: 'heading-3', icon: <FaHeading size={12} />, title: 'Заголовок 3' },
  { format: 'bulleted-list', icon: <FaListUl />, title: 'Маркированный список' },
  { format: 'numbered-list', icon: <FaListOl />, title: 'Нумерованный список' },
  { format: 'code-block', icon: <FaCode />, title: 'Блок кода' },
];

// Типы inline форматирования
const MARK_TYPES = [
  { format: 'bold', icon: <FaBold />, title: 'Жирный' },
  { format: 'italic', icon: <FaItalic />, title: 'Курсив' },
  { format: 'underline', icon: <FaUnderline />, title: 'Подчеркнутый' },
  { format: 'code', icon: <FaCode />, title: 'Код' },
];

// Типы выравнивания
const ALIGN_TYPES = [
  { format: 'left', icon: <FaAlignLeft />, title: 'Выравнивание по левому краю' },
  { format: 'center', icon: <FaAlignCenter />, title: 'Выравнивание по центру' },
  { format: 'right', icon: <FaAlignRight />, title: 'Выравнивание по правому краю' },
];

// Утилиты для форматирования
const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'bulleted-list' || format === 'numbered-list';

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleAlign = (editor: Editor, align: string) => {
  Transforms.setNodes(editor, { align }, { match: n => SlateElement.isElement(n) });
};

// Компонент кнопки форматирования
interface FormatButtonProps {
  format: string;
  icon: React.ReactNode;
  title: string;
  onMouseDown: (e: React.MouseEvent) => void;
  isActive: boolean;
}

const FormatButton: React.FC<FormatButtonProps> = ({
  format,
  icon,
  title,
  onMouseDown,
  isActive,
}) => (
  <button
    onMouseDown={onMouseDown}
    className={`toolbar-button ${isActive ? 'active' : ''}`}
    title={title}
    aria-label={title}
  >
    {icon}
  </button>
);

// Основной компонент панели инструментов
const Toolbar: React.FC = () => {
  const editor = useSlate();

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {MARK_TYPES.map(({ format, icon, title }) => (
          <FormatButton
            key={format}
            format={format}
            icon={icon}
            title={title}
            onMouseDown={e => {
              e.preventDefault();
              toggleMark(editor, format);
            }}
            isActive={isMarkActive(editor, format)}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        {BLOCK_TYPES.map(({ format, icon, title }) => (
          <FormatButton
            key={format}
            format={format}
            icon={icon}
            title={title}
            onMouseDown={e => {
              e.preventDefault();
              toggleBlock(editor, format);
            }}
            isActive={isBlockActive(editor, format)}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        {ALIGN_TYPES.map(({ format, icon, title }) => (
          <FormatButton
            key={format}
            format={format}
            icon={icon}
            title={title}
            onMouseDown={e => {
              e.preventDefault();
              toggleAlign(editor, format);
            }}
            isActive={false}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          title="Вставить изображение"
          onMouseDown={e => {
            e.preventDefault();
            const url = window.prompt('Введите URL изображения:');
            if (url) {
              const image = { type: 'image', url, children: [{ text: '' }] };
              Transforms.insertNodes(editor, image);
            }
          }}
        >
          <FaImage />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
