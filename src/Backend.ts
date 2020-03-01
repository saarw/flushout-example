import { Master, CompletionBatch, ApplyResult, Snapshot } from "flushout";
import { TodoList, BackendApi } from "./types";

export class Backend implements BackendApi {
    master: Master<TodoList>;

    constructor() {
        this.master = new Master<TodoList>({
            commandCount: 0,
            document: {
                todos: {}
            }
        });
    }

    latestSnapshot(): Promise<Snapshot<TodoList>> {
        // Copy to simulate a network encoding/decoding
        const snapshotCopy = JSON.parse(JSON.stringify(this.master.getSnapshot()));
        return Promise.resolve(snapshotCopy);
    }

    sendFlush(flush: CompletionBatch): Promise<ApplyResult<TodoList>> {
        return this.master.apply(flush).then(result => {
            // Copy to simulate network encoding/decoding
            return JSON.parse(JSON.stringify(result));
        });
    }
}