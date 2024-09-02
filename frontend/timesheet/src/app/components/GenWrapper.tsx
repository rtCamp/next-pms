import ErrorBoundary from "./errorBoundary";
type GenWrapperType = {
  children : React.ReactNode;
  props?:any
} 

const GenWrapper = ({children}:GenWrapperType) => {
  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
};

export default GenWrapper;
