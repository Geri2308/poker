import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      closeButton
      duration={5000}
      style={{
        zIndex: 10000,
      }}
      toastOptions={{
        style: {
          background: '#1f2937',
          border: '1px solid #374151',
          color: '#f9fafb',
        },
      }}
      {...props} />
  );
}

export { Toaster }
