"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { type FigmaNode, figmaNavLinks, figmaPages } from "@/data/figma-pages";
import { textOverrides } from "@/data/placeholders";
import { nodeOverrides, nodeStyles } from "@/data/real-data";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1040;

function FigmaElement({ node, slug }: { node: FigmaNode; slug: string }) {
  const style: CSSProperties = {
    position: "absolute",
    left: node.x,
    top: node.y,
    width: node.w,
    height: node.h,
  };

  const override = nodeStyles[node.id];
  if (override?.hidden) return null;
  if (override?.w !== undefined) style.width = override.w;
  if (override?.h !== undefined) style.height = override.h;
  if (override?.y !== undefined) style.top = override.y;

  if (node.type === "FRAME") {
    if (node.fill) style.background = node.fill;
    if (node.radius) style.borderRadius = node.radius;
    if (node.clip) style.overflow = "hidden";

    return (
      <div data-figma-id={node.id} style={style}>
        {node.children?.map((child) => (
          <FigmaElement key={child.id} node={child} slug={slug} />
        ))}
      </div>
    );
  }

  style.color = node.color ?? "#182923";
  style.fontFamily =
    node.font === "space" ? "var(--font-space-grotesk)" : "var(--font-inter)";
  style.fontWeight = node.weight ?? 400;
  style.fontSize = node.size ?? 14;
  style.lineHeight = 1.4;
  style.letterSpacing = "0.01em";
  style.whiteSpace = "pre";
  style.textAlign = node.align ?? "left";

  const source = node.text ?? "";
  const value = nodeOverrides[node.id] ?? textOverrides[source] ?? source;
  const href = figmaNavLinks[slug]?.[node.id];

  if (href) {
    return (
      <Link
        data-figma-id={node.id}
        href={href}
        style={{ ...style, textDecoration: "none" }}
      >
        {value}
      </Link>
    );
  }

  return (
    <div data-figma-id={node.id} style={style}>
      {value}
    </div>
  );
}

export function FigmaFrame({ slug }: { slug: string }) {
  const page = figmaPages[slug];
  const viewport = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const width = viewport.current?.clientWidth ?? DESIGN_WIDTH;
      const height = window.innerHeight;
      setScale(
        Math.min(
          1,
          width / (page?.w ?? DESIGN_WIDTH),
          height / (page?.h ?? DESIGN_HEIGHT),
        ),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [page]);

  if (!page) return null;

  return (
    <main ref={viewport} className="figma-viewport">
      <div className="figma-stage" style={{ height: page.h * scale }}>
        <div
          className="figma-canvas"
          style={{
            width: page.w,
            height: page.h,
            transform: `scale(${scale})`,
          }}
        >
          <FigmaElement node={{ ...page, x: 0, y: 0 }} slug={slug} />
        </div>
      </div>
    </main>
  );
}
