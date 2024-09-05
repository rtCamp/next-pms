import { Typography } from "./typography";

const DefaultErrorFallBack = () => {
  return (
    <>
      <div className={`w-full h-full flex justify-center items-center`}>
        <Typography variant="p" className={`text-slate-600 font-medium`}>
          {`Something went wrong`}
        </Typography>
      </div>
    </>
  );
};

export default DefaultErrorFallBack;
