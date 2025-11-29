import logo from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <img
      src={logo}
      alt="AfuChat Logo"
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
    />
  );
};

export default Logo;
