import { Card, Col, Divider, Row, Table, Typography } from 'antd'
import StateTag from '../components/StateTag'

const { Title, Paragraph, Text } = Typography

const stateRows = [
  { key: 1, applies: 'Reagents', state: 'sealed', means: 'Unopened, as it arrived' },
  { key: 2, applies: 'Reagents', state: 'opened', means: 'In use — the opened date is filled in the first time you set this' },
  { key: 3, applies: 'Primers, DNA', state: 'stock', means: 'The concentrated stock you dilute from' },
  { key: 4, applies: 'Primers, DNA', state: 'working', means: 'The working dilution on the bench' },
  { key: 5, applies: 'Everything', state: 'low', means: 'Running out — worth ordering or diluting more' },
  { key: 6, applies: 'Everything', state: 'empty', means: 'Gone. The slot is released; the record stays as history' },
]

export default function HelpPage() {
  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Help</Title>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>What anbār is for</Title>
        <Paragraph>
          anbār (انبار — <i>storehouse</i>) answers one question: <b>where is it right now?</b>
          Tessera holds specimens, Elementa holds molecular runs, Forma holds field records.
          anbār holds the physical location of the things in your freezers and fridges —
          primers, reagents and extracted DNA.
        </Paragraph>

        <Divider />

        <Title level={4}>How things are arranged</Title>
        <Paragraph>
          A <b>freezer</b> has shelves, and each shelf has slots. A <b>box</b> sits in one of those
          slots, and has its own grid of positions — rows lettered A, B, C… and columns numbered.
          A tube lives at one position, so a full location reads:
        </Paragraph>
        <Paragraph>
          <Text code>−20 A · Shelf 2 · Slot 1 · Box "Primers 2026" · C4</Text>
        </Paragraph>
        <Paragraph type="secondary">
          Nothing forces a tube to have a position — an unplaced tube is simply recorded as
          <Text code>Unplaced</Text>, which is a perfectly honest answer.
        </Paragraph>

        <Divider />

        <Title level={4}>Designs and their tubes</Title>
        <Paragraph>
          A primer, reagent or extract is recorded <b>once</b>, with its identity — sequence, gene,
          organism, supplier, kit. The physical tubes are recorded separately against it, each with
          its own location, owner and state. One primer design can have a stock aliquot in one box
          and a working dilution in another; you edit the design once, not three times.
        </Paragraph>

        <Divider />

        <Title level={4}>States, not quantities</Title>
        <Paragraph>
          anbār deliberately does <b>not</b> track volumes. A number that is only right when everyone
          remembers to log a withdrawal is worse than no number at all. Instead each tube carries a
          coarse state you set by hand when you notice:
        </Paragraph>
        <Table
          size="small"
          pagination={false}
          dataSource={stateRows}
          columns={[
            { title: 'Applies to', dataIndex: 'applies', width: 140 },
            { title: 'State', dataIndex: 'state', width: 120, render: (v: string) => <StateTag state={v} /> },
            { title: 'Means', dataIndex: 'means' },
          ]}
        />
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          Marking a tube <b>empty</b> releases its slot so someone can reuse the space, but keeps the
          record so you can still see what used to be there. Deleting removes it for good.
        </Paragraph>

        <Divider />

        <Title level={4}>Ownership</Title>
        <Paragraph>
          A tube belongs to a person with an anbār login, to a name typed by hand for people without
          one, or to the lab at large when you tick <b>Shared</b>.
        </Paragraph>

        <Divider />

        <Title level={4}>Working with the other apps</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Paragraph>
              With an Elementa URL and API token set in Settings, you can pull a primer design
              straight out of Elementa's library and link an extract to the run that produced it.
              anbār only ever reads from its siblings.
            </Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph>
              In the other direction, Elementa and Tessera can ask anbār where something is
              through <Text code>/integration/locate/...</Text>, using the anbār API token an admin
              sets in Settings. Those endpoints are read-only too.
            </Paragraph>
          </Col>
        </Row>
        <Paragraph type="secondary">
          If a sibling is not configured or is offline, its links and search boxes simply do not
          appear. Nothing in anbār stops working.
        </Paragraph>
      </Card>
    </div>
  )
}
