import { Snapshot, CompletionBatch, ApplyResult } from "flushout";

export interface TodoEntry {
    text: string;
    createdAt?: number;
}

export interface TodoList {
    todos: Record<string, TodoEntry>
}

export interface BackendApi {
    latestSnapshot: () => Promise<Snapshot<TodoList>>;
    sendFlush: (flush: CompletionBatch) => Promise<ApplyResult<TodoList>>;
}