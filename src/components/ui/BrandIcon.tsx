import logo from '../../../public/favicon.svg';

type Props = { size?: number; className?: string };

export function BrandIcon({ size = 24, className = '' }: Props) {
  return <img src={logo} width={size} height={size} className={className} />;
}
