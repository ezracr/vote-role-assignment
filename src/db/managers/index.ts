import ChSettings from './ChSettings'
import Documents from './Documents'
import Votes from './Votes'

export default class Managers {
  settings: ChSettings = new ChSettings()
  documents: Documents = new Documents()
  votes: Votes = new Votes()
}
