import { useEffect, useState } from "react";

export const useMethods = (ocap) => {
  const [methods, setMethods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ocap) return;
    ocap((err, funs) => {
      if (err) {
        setError(err);
      } else {
        setMethods(funs);
      }
      setLoading(false);
    });
  }, [ocap]);

  return { methods, loading, error };
};

export const getMethods = (ocap) => {
  const [methods, setMethods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ocap) return;
    ocap((err, funs) => {
      if (err) {
        setError(err);
      } else {
        setMethods(funs);
      }
      setLoading(false);
    });
  }, [ocap]);

  return { methods, loading, error };
};
