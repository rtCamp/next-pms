/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Internal dependencies.
 */
import { TIMESHEET } from "@/lib/constant";
import { Typography } from "../components/typography";
import { Button } from "../components/ui/button";

export default function Component() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <Typography variant="h1" className="text-4xl font-bold tracking-tighter sm:text-5xl animate-bounce">
            404
          </Typography>
          <Typography className="text-primary/60 text-base">
            Sorry, we couldn&#x27;t find the page you&#x27;re looking for.
          </Typography>
        </div>
        <Button
          onClick={() => {
            navigate(TIMESHEET);
          }}
        >
          <ArrowLeft />
          Return to Home
        </Button>
      </div>
    </div>
  );
}
