import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {TextField} from '@/components/ui/TextField';

type ChecklistAddItemFormProps = {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAdd: () => void;
};

export function ChecklistAddItemForm({
  description,
  name,
  onAdd,
  onDescriptionChange,
  onNameChange,
}: ChecklistAddItemFormProps) {
  return (
    <Card className="checklist-add-card">
      <h2>아이템 추가</h2>
      <form
        className="checklist-add-card__form"
        onSubmit={event => {
          event.preventDefault();
          onAdd();
        }}
      >
        <TextField
          aria-label="아이템 이름"
          onChange={event => onNameChange(event.target.value)}
          placeholder="아이템"
          value={name}
        />
        <TextField
          aria-label="아이템 설명"
          onChange={event => onDescriptionChange(event.target.value)}
          placeholder="설명"
          value={description}
        />
        <Button disabled={name.trim().length === 0} type="submit">
          추가
        </Button>
      </form>
    </Card>
  );
}
