import "./Chat.css";
import { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Mermaid from "./Mermaid";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");

          // Mermaid diagram
          if (match && match[1] === "mermaid") {
            return (
              <Mermaid
                chart={String(children).replace(/\n$/, "")}
              />
            );
          }

          // Normal code block
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);

  useEffect(() => {
    if (reply === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLatestReply(null);
      return;
    }

    if (!prevChats?.length) return;

    const content = reply.split(" ");

    let idx = 0;

    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" "));

      idx++;

      if (idx >= content.length) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [prevChats, reply]);

  return (
    <>
      {newChat && <h1>What can we explore today?</h1>}

      <div className="chats">

        {/* Previous messages */}
        {prevChats?.slice(0, -1).map((chat, idx) => (
          <div
            className={chat.role === "user" ? "userDiv" : "gptDiv"}
            key={idx}
          >
            {chat.role === "user" ? (
              <p className="userMessage">{chat.content}</p>
            ) : (
              <MarkdownRenderer content={chat.content} />
            )}
          </div>
        ))}

        {/* Latest message */}
        {prevChats.length > 0 && (
          <>
            {latestReply === null ? (
              <div className="gptDiv" key="non-typing">
                <MarkdownRenderer
                  content={prevChats[prevChats.length - 1].content}
                />
              </div>
            ) : (
              <div className="gptDiv" key="typing">
                <MarkdownRenderer content={latestReply} />
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}

export default Chat;
