import { type Post } from "@entities/post"
import { useWriteActionEditing } from "@shared/ui/providers/write-action-provider"
import { PostEditorForm } from "@widgets/post-editor"

interface InlineEditFormProps {
  post: Post
  onCancel: () => void
  onSaved: () => void
}

export default function InlineEditForm({ post, onCancel, onSaved }: InlineEditFormProps) {
  useWriteActionEditing()

  return <PostEditorForm post={post} onCancel={onCancel} onSaved={onSaved} />
}
