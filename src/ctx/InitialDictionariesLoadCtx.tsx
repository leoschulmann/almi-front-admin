import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Binyan } from "@/model/Binyan.ts";
import { Preposition } from "@/model/Preposition.ts";
import { Gizrah } from "@/model/Gizrah.ts";
import { getAsMap, getDataVector } from "@/util/ApiClient.ts";
import { Lang } from "@/model/Lang.ts";

interface Dictionary {
  binyans: Binyan[];
  gizrahs: Gizrah[];
  prepositions: Preposition[];
  langs: Lang[];
}

const DictionaryContext = createContext<Dictionary | null>(null);

// Hook to access data from the context
export function useDictionaryContext() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error("useDataContext must be used within DataProvider");
  }
  return context;
}

export function DictionaryContextProvider({ children }: { children: ReactNode }) {
  const [binyans, setBinyans] = useState<Binyan[]>([]);
  const [gizrahs, setGizrahs] = useState<Gizrah[]>([]);
  const [prepositions, setPrepositions] = useState<Preposition[]>([]);
  const [langs, setLangs] = useState<Lang[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          fetchedLangs,
          fetchedBinyans,
          fetchedGizrahs,
          fetchedPrepositions,
        ] = await Promise.all([
          getAsMap("lang"),
          getDataVector("binyan", Binyan),
          getDataVector("gizrah", Gizrah),
          getDataVector("preposition", Preposition),
        ]);

        const mapToArray: Lang[] = Object.entries(fetchedLangs).map(
          ([key, val]) => new Lang(key, val),
        );

        setLangs(mapToArray);
        setBinyans(fetchedBinyans);
        setGizrahs(fetchedGizrahs);
        setPrepositions(fetchedPrepositions);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    void fetchData();
  }, []); // Runs only once when the component mounts

  if (!binyans.length || !gizrahs.length || !prepositions.length) {
    return <div>Loading...</div>;
  }

  return (
    <DictionaryContext.Provider
      value={{ binyans, gizrahs, prepositions, langs }}
    >
      {children}
    </DictionaryContext.Provider>
  );
}
