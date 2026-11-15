/**
 * TypeScript types for the DB OpenBoards POST /departures response.
 *
 * These interfaces model the response shape in the supplied JSON sample.
 * Fields that were absent from some sample records are optional. String-valued
 * codes are kept as `string` rather than narrow unions so new DB values remain
 * representable without changing this file.
 *
 * The supplied response is a JSON array containing one OpenBoards response
 * object, so the top-level type is OpenBoardsResponse[].
 */

export type OpenBoardsResponse = OpenBoardsResponseItem[];

export interface OpenBoardsResponseItem {
  administrations: Administration[];
  departures: Departure[];
  messages: Messages;
  meta: Meta;
  stations: Station[];
  stopPlaces: StopPlace[];
}

export interface Administration {
  administrationId: string;
  operatorCode: string;
  operatorName: string;
  transportCompanies: TransportCompany[];
}

export interface TransportCompany {
  email: string;
  language: string;
  name: string;
  phoneNumber: string;
  shortName: string;
  website: string;
  websiteDigitalAssistant?: string;
}

export interface Departure {
  departureId: string;
  evaNumber: string;
  futureDisruptions?: boolean;
  journeyId: string;
  journeyInfo: JourneyInfo;
  /** References Messages.attributes / Messages.disruptions by messageID. */
  messages: number[];
  platform: Platform;
  platformSchedule: Platform;
  time: string;
  timeSchedule: string;
  timeType: string;
  transport: Transport;
  travelsWith?: TravellingService[];
  vehicleSequenceAvailable?: boolean;
}

export interface JourneyInfo {
  destination: StopReference;
  headerAdministrationId: string;
  headerJourneyNumber: number;
  origin: StopReference;
  scheduledStartTime: string;
  transportAtStart: TransportAtStart;
  type: string;
}

export interface TransportAtStart {
  administrationId: string;
  category: string;
  categoryInternal: string;
  dfid?: string;
  dtid?: string;
  journeyDescription: string;
  journeyNumber: number;
  label?: string;
  line: Line;
  operationalJourneyNumber?: string;
  type: string;
}

export interface Transport {
  administrationId: string;
  category: string;
  categoryInternal: string;
  dfid?: string;
  direction: Direction;
  dtid?: string;
  journeyDescription: string;
  journeyNumber: number;
  label?: string;
  line: Line;
  operationalJourneyNumber?: string;
  type: string;
  via: ViaStop[];
}

export interface Line {
  name: string;
}

export interface Direction {
  stopPlaces: StopReference[];
}

export interface StopReference {
  evaNumber: string;
}

export interface ViaStop extends StopReference {
  displayPriority: number;
}

export interface Platform {
  ifopt: string;
  name: string;
}

export interface TravellingService {
  administrationId: string;
  category: string;
  categoryInternal: string;
  destination: StopReference;
  journeyDescription: string;
  /** The sample uses the capitalized spelling `journeyID`. */
  journeyID: string;
  journeyNumber: number;
  line: Line;
  operationalJourneyNumber?: string;
  separationAt: StopReference;
  type: string;
}

export interface Messages {
  attributes: MessageAttribute[];
  disruptions: Disruption[];
}

export interface MessageAttribute {
  code: string;
  descriptions: LocalizedDescription[];
  messageID: number;
}

export interface Disruption {
  cause: string;
  descriptions: LocalizedDescription[];
  displayPriority: number;
  disruptionCommunicationID: string;
  disruptionID: string;
  effect: string;
  messageID: number;
}

export interface LocalizedDescription {
  language: string;
  text: string;
  textShort?: string;
}

export interface Meta {
  consideredStopPlaces: string[];
}

export interface Station {
  localizedNames: LocalizedName[];
  stada: string;
}

export interface StopPlace {
  evaNumber: string;
  ifopt: string;
  localizedNames: LocalizedName[];
  stada: string;
}

export interface LocalizedName {
  language: string;
  name: string;
}
