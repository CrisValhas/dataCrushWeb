import React from 'react';

interface BaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ConnectButtonProps extends BaseButtonProps {
  variant?: 'connect' | 'primary';
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

interface ActionButtonProps extends BaseButtonProps {
  variant: 'reauthorize' | 'disconnect' | 'primary';
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

type ButtonProps = ConnectButtonProps | ActionButtonProps;

export function Button({ 
  onClick, 
  disabled = false, 
  fullWidth = false, 
  className = '', 
  variant = 'connect',
  children,
  type = 'button',
  size = 'md',
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-3 py-2 text-sm rounded-lg',
    lg: 'px-4 py-2.5 text-base rounded-lg',
  } as const;
  const baseClasses = `${sizeClasses[size]} font-medium transition-colors`;
  const fullWidthClass = fullWidth ? "w-full" : "";
  
  const variantClasses = {
    connect: "bg-white text-blue-500 border border-blue-200 hover:bg-blue-50",
    reauthorize: "bg-white text-blue-500 border border-blue-200 hover:bg-blue-50",
    disconnect: "bg-white text-red-500 border border-red-200 hover:bg-red-50",
    // Alinear primary con el botón "Integraciones" de las cards (bg azul muy claro, sin borde)
    primary: "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
  };

  const combinedClasses = `${baseClasses} ${fullWidthClass} ${variantClasses[variant]} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`.trim();

  return (
    <button
      className={combinedClasses}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Componentes específicos para mejor ergonomía
export function ConnectButton({ children, ...props }: Omit<ConnectButtonProps, 'variant'>) {
  return (
    <Button variant="connect" {...props}>
      {children}
    </Button>
  );
}

export function ReauthorizeButton({ children, ...props }: Omit<ActionButtonProps, 'variant'>) {
  return (
    <Button variant="reauthorize" {...props}>
      {children}
    </Button>
  );
}

export function DisconnectButton({ children, ...props }: Omit<ActionButtonProps, 'variant'>) {
  return (
    <Button variant="disconnect" {...props}>
      {children}
    </Button>
  );
}