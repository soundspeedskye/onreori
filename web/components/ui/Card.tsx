import {
  createElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from 'react';

type NonActionableCardProps = HTMLAttributes<HTMLDivElement> & {
  asButton?: false;
  onClick?: undefined;
};

type ActionableCardProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> &
  (
    | {
        asButton: true;
      }
    | {
        asButton?: true;
        onClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
      }
  );

type CardProps = NonActionableCardProps | ActionableCardProps;

export function Card(props: CardProps) {
  const {asButton = false, children, className, onClick} = props;
  const classes = ['ui-card', className].filter(Boolean).join(' ');

  if (asButton || onClick) {
    const {
      asButton: _asButton,
      children: _children,
      className: _className,
      ...buttonProps
    } = props as ActionableCardProps;

    return createElement(
      'button',
      {
        ...buttonProps,
        className: classes,
        onClick,
        type: 'button',
      },
      children,
    );
  }

  const {
    asButton: _asButton,
    children: _children,
    className: _className,
    onClick: _onClick,
    ...divProps
  } = props;

  return createElement(
    'div',
    {
      ...divProps,
      className: classes,
    },
    children,
  );
}
