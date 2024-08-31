import axios from "axios";
// import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston"
});

export const executeCode = async (language, sourceCode) => {
    try {
        const response = await API.post("/execute", {
            language: 'javascript',
            version: '18.15.0',
            files: [
                {
                    name: `code.${language}`,
                    content: sourceCode
                }
            ],
            stdin: "", // you can add stdin if needed
            args: [], // you can add args if needed
        });
        return response.data;
    } catch (error) {
        throw new Error("Failed to execute code");
    }
};
