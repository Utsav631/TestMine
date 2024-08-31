import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../Actions";
import Output from "./Output";
import toast from "react-hot-toast";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const initEditor = () => {
      const textareaElement = document.getElementById("realtimeEditor");
      if (textareaElement && !editorRef.current) {
        editorRef.current = Codemirror.fromTextArea(textareaElement, {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        });

        editorRef.current.on("change", (instance, changes) => {
          const { origin } = changes;
          const code = instance.getValue();
          onCodeChange(code);
          if (origin !== "setValue" && socketRef.current) {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
              roomId,
              code,
            });
          }
        });
      }
    };

    initEditor();

    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (editorRef.current && editorRef.current.getValue() !== code) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };
  }, [socketRef, roomId, onCodeChange]);

  const copyCode = async () => {
    if (editorRef.current) {
      try {
        await navigator.clipboard.writeText(editorRef.current.getValue());
        toast.success("Code has been copied to your clipboard");
      } catch (err) {
        toast.error("Could not copy the Code");
        console.error(err);
      }
    } else {
      toast.error("Editor is not initialized");
    }
  };

  return (
    <div className="editorcontainer">
      <div className="copyHeader">
        <button className="btn copyCode" onClick={copyCode}>
          Copy Code
        </button>
      </div>
      <div>
        <textarea id="realtimeEditor"></textarea>
        <Output editorRef={editorRef} />
      </div>
    </div>
  );
};

export default Editor;
