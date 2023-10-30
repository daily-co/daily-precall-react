import React from 'react';
import './Card.css';
interface Props {
  title: string;
}

export const Card: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  title,
}) => {
  return (
    <article className="card">
      <h1>{title}</h1>
      {children}
    </article>
  );
};
