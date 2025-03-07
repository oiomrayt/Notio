import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { createEditor, Descendant, Editor as SlateEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import Toolbar from './Toolbar';
import { useDebounce } from '../../hooks/useDebounce';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { savePage, selectCurrentPage } from '../../store/slices/pagesSlice';

// Типы элементов редактора
type CustomElement = {
  type:
    | 'paragraph'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'bulleted-list'
    | 'numbered-list'
    | 'list-item'
    | 'image'
    | 'code-block'
    | 'table'
    | 'table-row'
    | 'table-cell';
  children: CustomText[] | CustomElement[];
  url?: string;
  align?: 'left' | 'center' | 'right';
  [key: string]: any;
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
  background?: string;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: SlateEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const Editor: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector(selectCurrentPage);

  // Инициализация редактора Slate
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // Начальное значение редактора (пустая страница или загруженное содержимое)
  const [value, setValue] = useState<Descendant[]>(
    currentPage?.content
      ? JSON.parse(JSON.stringify(currentPage.content))
      : [{ type: 'paragraph', children: [{ text: '' }] }],
  );

  // Дебаунс для автосохранения
  const debouncedValue = useDebounce(value, 1000);

  // Автосохранение при изменении содержимого
  useEffect(() => {
    if (pageId && debouncedValue) {
      dispatch(
        savePage({
          id: pageId,
          content: debouncedValue,
        }),
      );
    }
  }, [debouncedValue, pageId, dispatch]);

  // Рендеринг элементов редактора
  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'heading-1':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-2':
        return <h2 {...props.attributes}>{props.children}</h2>;
      case 'heading-3':
        return <h3 {...props.attributes}>{props.children}</h3>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      case 'image':
        return (
          <div {...props.attributes}>
            <div contentEditable={false}>
              <img src={props.element.url} alt="" style={{ width: '100%' }} />
            </div>
            {props.children}
          </div>
        );
      case 'code-block':
        return (
          <pre {...props.attributes}>
            <code>{props.children}</code>
          </pre>
        );
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  // Рендеринг текстовых листов с форматированием
  const renderLeaf = useCallback((props: any) => {
    let { leaf, attributes, children } = props;

    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underline) {
      children = <u>{children}</u>;
    }

    if (leaf.code) {
      children = <code>{children}</code>;
    }

    if (leaf.color) {
      children = <span style={{ color: leaf.color }}>{children}</span>;
    }

    if (leaf.background) {
      children = <span style={{ backgroundColor: leaf.background }}>{children}</span>;
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  // Обработка горячих клавиш
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Ctrl+B для жирного текста
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      const isActive = SlateEditor.marks(editor)?.bold;
      if (isActive) {
        editor.removeMark('bold');
      } else {
        editor.addMark('bold', true);
      }
    }

    // Ctrl+I для курсива
    if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      const isActive = SlateEditor.marks(editor)?.italic;
      if (isActive) {
        editor.removeMark('italic');
      } else {
        editor.addMark('italic', true);
      }
    }
  };

  return (
    <div className="editor-container">
      <Slate editor={editor} value={value} onChange={setValue}>
        <Toolbar />
        <div className="editor-content">
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Начните писать..."
            spellCheck
            autoFocus
            onKeyDown={handleKeyDown}
            className="editor"
          />
        </div>
      </Slate>
    </div>
  );
};

export default Editor;
