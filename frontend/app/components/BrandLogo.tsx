import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'orange';
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

export default function BrandLogo({
  href = '/',
  className = '',
  variant = 'light',
  size = 'md',
}: BrandLogoProps) {
  const src =
    variant === 'dark'
      ? '/images/brand/logo-mandinmarket-light.png'
      : '/images/brand/logo-mandinmarket.png';

  const content = (
    <Image
      src={src}
      alt="MandinMarket"
      width={280}
      height={43}
      priority
      className={`w-auto ${sizeClass[size]} ${className}`}
    />
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="inline-flex items-center hover:opacity-90 transition-opacity"
      aria-label="MandinMarket"
    >
      {content}
    </Link>
  );
}
