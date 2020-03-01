import { Master, CompletionBatch, ApplyResult, Snapshot, CommandAction, Command } from "flushout";
import { TodoList, BackendApi, TodoEntry } from "./types";

export class Backend implements BackendApi {
    master: Master<TodoList>;

    constructor() {
        this.master = new Master<TodoList>({
            commandCount: 0,
            document: {
                todos: {}
            }
        }, {
            // Use an interceptor to set the createdAt time when the command is applied on the master
            interceptor: (_document: TodoList, command: Command<TodoEntry>) => {
                if (command.action === CommandAction.Create) {
                    return {
                        newProps: {
                            ...command.props,
                            createdAt: new Date().getTime()
                        }
                    };
                }
                return undefined;
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