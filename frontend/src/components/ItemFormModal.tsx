import { useEffect } from 'react'
import {
  Alert, Checkbox, DatePicker, Divider, Form, Input, InputNumber, Modal, Select, Space, message,
} from 'antd'
import dayjs from 'dayjs'
import { useBoxes } from '../hooks/useBoxes'
import { useCreateItem, useUpdateItem } from '../hooks/useItems'
import { useLookupOptions } from '../hooks/useLookups'
import { useUsers } from '../hooks/useUsers'
import { statesFor } from '../types'
import type { ItemType, StoredItem } from '../types'

const STATE_LABELS: Record<string, string> = {
  sealed: 'Sealed', opened: 'Opened', stock: 'Stock', working: 'Working',
  low: 'Low', empty: 'Empty',
}

interface Props {
  open: boolean
  onClose: () => void
  itemType: ItemType
  /** The design/product/extract this tube belongs to. */
  parentId: number
  editTarget?: StoredItem | null
  /** Pre-selected placement, e.g. when adding from a box map cell. */
  defaultBoxId?: number
  defaultRow?: number
  defaultCol?: number
}

export default function ItemFormModal({
  open, onClose, itemType, parentId, editTarget, defaultBoxId, defaultRow, defaultCol,
}: Props) {
  const [form] = Form.useForm()
  const { data: boxes = [] } = useBoxes()
  const { data: users = [] } = useUsers()
  const units = useLookupOptions('concentration_unit')
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()

  const states = statesFor(itemType)
  const isShared = Form.useWatch('is_shared', form)
  const boxId = Form.useWatch('box_id', form)
  const state = Form.useWatch('state', form)
  const selectedBox = boxes.find((b) => b.id === boxId)

  useEffect(() => {
    if (!open) return
    if (editTarget) {
      form.setFieldsValue({
        ...editTarget,
        date_added: editTarget.date_added ? dayjs(editTarget.date_added) : undefined,
        opened_date: editTarget.opened_date ? dayjs(editTarget.opened_date) : undefined,
        expiry_date: editTarget.expiry_date ? dayjs(editTarget.expiry_date) : undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        state: states[0],
        box_id: defaultBoxId,
        row: defaultRow,
        col: defaultCol,
        date_added: dayjs(),
        concentration_unit: itemType === 'primer' ? 'uM' : itemType === 'extract' ? 'ng/uL' : undefined,
      })
    }
  }, [open, editTarget, defaultBoxId, defaultRow, defaultCol])

  const handleSave = async (values: Record<string, unknown>) => {
    const payload: Record<string, unknown> = {
      ...values,
      date_added: values.date_added ? dayjs(values.date_added as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      opened_date: values.opened_date ? dayjs(values.opened_date as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      expiry_date: values.expiry_date ? dayjs(values.expiry_date as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    }
    if (payload.is_shared) payload.owner_id = null

    try {
      if (editTarget) {
        await updateItem.mutateAsync({ id: editTarget.id, payload })
        message.success('Tube updated')
      } else {
        await createItem.mutateAsync({
          ...payload,
          item_type: itemType,
          [`${itemType}_id`]: parentId,
        })
        message.success('Tube added')
      }
      onClose()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not save the tube')
    }
  }

  return (
    <Modal
      title={editTarget ? 'Edit tube' : 'Add tube'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editTarget ? 'Save' : 'Add'}
      confirmLoading={createItem.isPending || updateItem.isPending}
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
        <Space style={{ width: '100%' }} align="start">
          <Form.Item name="label" label="Tube label" style={{ flex: 1, minWidth: 240 }}
                     tooltip="What is written on the cap">
            <Input placeholder="e.g. 16S-F stock" />
          </Form.Item>
          <Form.Item name="state" label="State" rules={[{ required: true }]} style={{ width: 160 }}>
            <Select options={states.map((s) => ({ value: s, label: STATE_LABELS[s] ?? s }))} />
          </Form.Item>
        </Space>

        {state === 'empty' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Marking a tube empty releases its slot so the space can be reused. The record stays as history until you delete it."
          />
        )}

        <Divider orientation="left" plain style={{ marginTop: 0 }}>Location</Divider>
        <Space style={{ width: '100%' }} align="start">
          <Form.Item name="box_id" label="Box" style={{ width: 260 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Unplaced"
              options={boxes.map((b) => ({ value: b.id, label: b.location || b.name }))}
            />
          </Form.Item>
          <Form.Item name="row" label="Row" style={{ width: 110 }}>
            <Select
              allowClear
              disabled={!selectedBox || state === 'empty'}
              options={Array.from({ length: selectedBox?.rows ?? 0 }, (_, i) => ({
                value: i + 1, label: String.fromCharCode(65 + i),
              }))}
            />
          </Form.Item>
          <Form.Item name="col" label="Column" style={{ width: 110 }}>
            <Select
              allowClear
              disabled={!selectedBox || state === 'empty'}
              options={Array.from({ length: selectedBox?.cols ?? 0 }, (_, i) => ({
                value: i + 1, label: String(i + 1),
              }))}
            />
          </Form.Item>
        </Space>

        <Divider orientation="left" plain>Ownership</Divider>
        <Form.Item name="is_shared" valuePropName="checked" style={{ marginBottom: 12 }}>
          <Checkbox>Shared lab stock — belongs to nobody in particular</Checkbox>
        </Form.Item>
        {!isShared && (
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="owner_id" label="Owner" style={{ width: 260 }}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Someone with a login"
                options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              />
            </Form.Item>
            <Form.Item name="owner_name" label="or a name" style={{ width: 240 }}
                       tooltip="For people without an anbār login">
              <Input placeholder="e.g. visiting student" />
            </Form.Item>
          </Space>
        )}

        <Divider orientation="left" plain>Details</Divider>
        <Space style={{ width: '100%' }} align="start">
          <Form.Item name="concentration" label="Concentration" style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="concentration_unit" label="Unit" style={{ width: 120 }}>
            <Select allowClear options={units} />
          </Form.Item>
          <Form.Item name="volume_ul" label="Volume (µL)" style={{ width: 140 }}
                     tooltip="Recorded for reference only — never counted down">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="date_added" label="Date added" style={{ width: 150 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        {itemType === 'reagent' && (
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="lot_number" label="Lot number" style={{ width: 180 }}>
              <Input placeholder="e.g. L-4471" />
            </Form.Item>
            <Form.Item name="expiry_date" label="Expiry" style={{ width: 160 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="opened_date" label="Opened" style={{ width: 160 }}
                       tooltip="Filled in automatically the first time you mark the bottle opened">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        )}

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
